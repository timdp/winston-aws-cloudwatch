const gulp = require('gulp')
const plugins = require('gulp-load-plugins')()
const isparta = require('isparta')
const del = require('del')
const mkdirp = require('mkdirp')
const path = require('path')

const pkg = require('./package.json')
const dest = path.dirname(pkg.main)

const plumb = function () {
  return plugins.plumber({
    errorHandler: plugins.notify.onError('<%= error.message %>')
  })
}

gulp.task('clean', function () {
  del.sync([dest])
})

gulp.task('build', ['test'], function () {
  mkdirp.sync(dest)
  return gulp.src('src/**/*.es6')
    .pipe(plumb())
    .pipe(plugins.babel({optional: ['runtime']}))
    .pipe(gulp.dest(dest))
})

const test = function () {
  return gulp.src(['test/lib/setup.es6', 'test/unit/**/*.es6'], {read: false})
    .pipe(plumb())
    .pipe(plugins.mocha({reporter: 'dot'}))
}

require('babel/register')({extensions: ['.es6']})

gulp.task('coverage', function (done) {
  gulp.src(['src/**/*.es6'])
    .pipe(plumb())
    .pipe(plugins.istanbul({instrumenter: isparta.Instrumenter}))
    .pipe(plugins.istanbul.hookRequire({extensions: ['.es6']}))
    .on('finish', function () {
      return test()
        .pipe(plugins.istanbul.writeReports())
        .on('end', done)
    })
})

gulp.task('coveralls', ['coverage'], function () {
  return gulp.src('coverage/lcov.info')
    .pipe(plumb())
    .pipe(plugins.coveralls())
})

gulp.task('test', test)

gulp.task('watch', function () {
  gulp.watch(['{src,test}/**/*'], ['build'])
})

gulp.task('default', ['build'], function () {
  gulp.start('watch')
})
