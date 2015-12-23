'use strict'

import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
import {Instrumenter} from 'isparta'
import del from 'del'
import mkdirp from 'mkdirp'
import seq from 'run-sequence'

const DEST = 'lib'

const $ = loadPlugins()

const plumb = () => $.plumber({
  errorHandler: $.notify.onError('<%= error.message %>')
})

const test = () => {
  return gulp.src(['test/lib/setup.js', 'test/unit/**/*.js'], {read: false})
    .pipe(plumb())
    .pipe($.mocha({reporter: 'dot'}))
}

gulp.task('clean', () => del.sync(DEST))

gulp.task('build', ['test'], () => {
  mkdirp.sync(DEST)
  return gulp.src('src/**/*.js')
    .pipe(plumb())
    .pipe($.babel())
    .pipe(gulp.dest(DEST))
})

gulp.task('cleanbuild', cb => seq('clean', 'build', cb))

gulp.task('coverage', cb => {
  gulp.src('src/**/*.js')
    .pipe(plumb())
    .pipe($.istanbul({instrumenter: Instrumenter}))
    .pipe($.istanbul.hookRequire())
    .on('finish', () => test().pipe($.istanbul.writeReports()).on('end', cb))
})

gulp.task('coveralls', ['coverage'], () => {
  return gulp.src('coverage/lcov.info')
    .pipe(plumb())
    .pipe($.coveralls())
})

gulp.task('test', test)

gulp.task('watch', () => gulp.watch('{src,test}/**/*', ['cleanbuild']))

gulp.task('default', ['cleanbuild'], () => gulp.start('watch'))
