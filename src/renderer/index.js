// In renderer process (web page).
"use strict"

const electron = require('electron')
const ipc = electron.ipcRenderer
const remote = electron.remote
const app = remote.app
const win = remote.getCurrentWindow()
const assert = require('power-assert')
const appEnv = remote.getGlobal('appEnv')

const webview = document.getElementById('view01')

<!-- build:remove-->
global.require('stringify').registerWithRequire({
        extensions: ['.html']
    })
    <!-- endbuild -->

if (appEnv.isDebug) {
    // win.openDevTools()
}
if (appEnv.isWatch) {
  require('electron-connect').client.create()
}

function clickClose() {
    win.close()
}

function clickMinimize() {
    ipc.send('minimize', true)
}

function clickMaximize() {
    ipc.send('maximize', true)
}

function clickReload() {
    webview.reload()
}

function clickPyRestart() {
    ipc.send('py-restart', true)
}

function clickRenderDevTools() {
    win.isDevToolsOpened() ? win.closeDevTools() : win.openDevTools()
}

function clickPythonDevTools() {
    webview.isDevToolsOpened() ? webview.closeDevTools() : webview.openDevTools()
}

ipc.on("py-stdout", (ev, data) => {
    console.log("[PY STDOUT] " + data.toString().replace(/\n+$/g, ''))
})

ipc.on("py-stderr", (ev, data) => {
    console.log("[PY STDERR] " + data.toString().replace(/\n+$/g, ''))
})
