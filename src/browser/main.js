'use strict'

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain
const client = require('electron-connect').client
const windowStateKeeper = require('electron-window-state');

var win = null
var subpy = null
var pyarg = [require('path').join(__dirname, '../../python/index.py'), "--debug"]

var template = []

global.appEnv = {
    title: process.env.NAME,
    version: process.env.VERSION,
    env: process.env.NODE_ENV || 'development',
    isDebug: /--debug/.test(process.argv[2]),
    isWatch: /--watch/.test(process.argv[2]),
    gitHash: process.env.GIT_HASH,
    root: process.env.ROOT,
}

var shouldQuit = app.makeSingleInstance((argv, workingDirectory) => {})
if (shouldQuit) app.quit()

app.on('window-all-closed', () => {
    app.quit()
})

app.on('ready', () => {
    let mainWindowState = windowStateKeeper({
      defaultWidth: 1024,
      defaultHeight: 768
    });

    win = new BrowserWindow({
      'x': mainWindowState.x,
      'y': mainWindowState.y,
      'width': mainWindowState.width,
      'height': mainWindowState.height,
      "frame": false,
      "title": appEnv.title
    })
    mainWindowState.manage(win);

    var url = require('url').format({
            protocol: 'file',
            slashes: true,
            pathname: require('path').join(__dirname, '../renderer/index.html')
        })
        // var url = 'http://localhost:5000'

    pyStart()

    require('devtron').install()
    win.setMenu(null)
    win.loadURL(url)

    if (appEnv.isDebug) {
      win.maximize()
      win.webContents.openDevTools()
    }

    win.on('closed', () => {
        win = null
        pyStop()
    })
    win.webContents.on('did-finish-load', () => {})
    if (appEnv.isWatch) {
        let cl = client.create(win)
        app.on('quit', () => {
                cl.sendMessage('quit')
            })
            // win.openDevTools()
    }
})

function pyStart() {
  if (!subpy)
    pyStop()
  subpy = require('child_process').spawn('python', pyarg)
  subpy.stdout.on('data', function(data) {
      win.webContents.send('py-stdout', data)
      console.log('[PY stdout]: ' + data.toString().replace(/\n+$/g, ''));
  });

  subpy.stderr.on('data', (data) => {
      win.webContents.send('py-stderr', data)
      console.log('[PY stderr]: ' + data.toString().replace(/\n+$/g, ''));
  });

  subpy.on('close', (code) => {
      console.log('[PY SPAWN] child process exited with code ' + code);
  });

  let s = '[PY SYSTEM]: Python Start.'
  win.webContents.send('py-stdout', s)
  console.log(s);
}

function pyStop() {
  if (subpy) {
    subpy.kill('SIGINT')
    subpy = null

    let s = '[PY SYSTEM]: Python Stop.'
    win.webContents.send('py-stdout', s)
    console.log(s);
  }
}

function pyRestart() {
  pyStop()
  pyStart()
}


ipc.on('minimize', (e, arg) => {
    win.minimize()
})

ipc.on('maximize', (e, arg) => {
    win.isMaximized() ? win.unmaximize() : win.maximize()
})

ipc.on('py-restart', (e, arg) => {
    pyRestart()
})
