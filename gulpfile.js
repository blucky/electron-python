"use strict"
const conf = require('./package.json')
const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
const browserify = require('browserify')
const stringify = require('stringify')
const buffer = require('vinyl-buffer')
const source = require('vinyl-source-stream')
const packager = require('electron-packager')
const childProcess = require('child_process')
const fs = require("fs")
const archiver = require('archiver')
// var $ = require('gulp-load-plugins')({
//     pattern: ['gulp-*', 'gulp.*'],
//     replaceString: /\bgulp[\-.]/
// });

//const git_hash = childProcess.execSync('git rev-parse HEAD').toString().trim()


gulp.task('start', ['build:sass'])
gulp.task('default', ['watch'])
gulp.task('build', ['build:cp', 'build:js:browser', 'build:js:renderer', 'build:sass'])

gulp.task('build:sass', () => {
    gulp.src('src/style/*.scss')
        .pipe($.sass())
        .pipe(gulp.dest('./build/style/'))

    gulp.src('./vendor/photon/fonts/*')
        .pipe(gulp.dest('./build/fonts/'))

    gulp.src('./vendor/font-awesome/fonts/*')
        .pipe(gulp.dest('./build/fonts/'))
})

gulp.task('build:js:browser', () => {
    browserify({
            entries: ['src/browser/main.js'],
            extensions: ['.js'],
            ignoreMissing: true,
            detectGlobals: false,
            builtins: [],
            debug: true,
        })
        .transform({
            NODE_ENV: 'production',
            NAME: conf.name,
            VERSION: conf.version,
            ROOT: __dirname,
        }, 'envify')
        .transform('unassertify')
        .bundle()
        .on('error', handleErrors)
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(gulp.dest('build/browser'))
})

gulp.task('build:js:renderer', () => {
    browserify({
            transform: stringify({
                extensions: ['.html'],
                minify: true,
            }),
            entries: [
                'src/renderer/index.js',
            ],
            ignoreMissing: true,
            detectGlobals: false,
            builtins: [],
            debug: true,
        })
        .transform('unassertify')
        .bundle()
        .on('error', handleErrors)
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(gulp.dest('build/renderer'))
})

gulp.task('build:cp', () => {
    gulp.src('./src/renderer/*.html')
        .pipe(gulp.dest('./build/renderer'))
    gulp.src('./src/package.json')
        .pipe(gulp.dest('./build/'))
})

gulp.task('release:osx', ['build'], (done) => {
    let packagerConf = {
        dir: 'build',
        out: 'build/release/',
        name: conf.name,
        arch: 'x64',
        platform: 'darwin',
        version: '0.36.1',
        icon: 'images/黒_gray.icns',
        ignore: ['tmp', 'release'],
        overwrite: true,
    }

    if (process.env.ELECTRON_SIGN) {
        packagerConf['sign'] = process.env.ELECTRON_SIGN
    }

    packager(packagerConf, (err, path) => {
        let archive = archiver.create('zip', {})
        let output = fs.createWriteStream(`build/release/${conf.name}-${conf.version}.zip`)
        output.on('end', () => {
            done()
        })
        archive.pipe(output)
        archive.directory(`build/release/${conf.name}-darwin-x64/`, false)
        archive.finalize()
    })

})

gulp.task('release', ['release:osx'])

gulp.task('watch', ['build:sass'], () => {
    const electron = require('electron-connect').server.create({
        path: 'src/',
        spawnOpt: {
            env: {
                //		GIT_HASH: git_hash,
                ROOT: __dirname,
                NAME: conf.name,
                VERSION: conf.version,
            }
        }
    })
    electron.start("--debug --watch")
    gulp.watch('src/browser/**/*', electron.restart)
    gulp.watch('src/renderer/**/*', electron.reload)
    gulp.watch('src/style/*.scss', ['build:sass', electron.reload])
    electron.on('quit', () => {
            process.exit(0)
        })
        // electron.on('changeBounds', (arg) => console.dir(arg))
})

// module.exports = function() {
function handleErrors() {
  var args = Array.prototype.slice.call(arguments);

  // Send error to notification center with gulp-notify
  $.notify.onError({
    title: "Compile Error",
    message: "<%= error %>"
  }).apply(this, args);

  // Keep gulp from hanging on this task
  this.emit('end');
};
