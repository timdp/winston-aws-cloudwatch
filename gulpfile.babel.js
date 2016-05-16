import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
import {Instrumenter} from 'isparta'
import del from 'del'
import seq from 'run-sequence'

const $ = loadPlugins()

const plumb = () => $.plumber({
  errorHandler: $.notify.onError('<%= error.message %>')
})

const test = () => {
  return gulp.src(['test/lib/setup.js', 'test/unit/**/*.js'], {read: false})
    .pipe($.if(!process.env.CI, plumb()))
    .pipe($.mocha({reporter: 'spec'}))
}

gulp.task('clean', () => del('lib'))

gulp.task('transpile', () => {
  return gulp.src('src/**/*.js')
    .pipe(plumb())
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('lib'))
})

gulp.task('lint', () => {
  return gulp.src('src/**/*.js')
    .pipe(plumb())
    .pipe($.standard())
    .pipe($.standard.reporter('default', {
      breakOnError: false
    }))
})

gulp.task('pre-coverage', () => {
  return gulp.src('src/**/*.js')
    .pipe($.istanbul({instrumenter: Instrumenter}))
    .pipe($.istanbul.hookRequire())
})

gulp.task('coverage', ['pre-coverage'], () => {
  return test()
    .pipe($.istanbul.writeReports())
    .pipe($.istanbul.enforceThresholds({thresholds: {global: 70}}))
})

gulp.task('coveralls', ['coverage'], () => {
  return gulp.src('coverage/lcov.info')
    .pipe($.coveralls())
})

gulp.task('test', test)

gulp.task('build', (cb) => seq('lint', 'coverage', 'transpile', cb))

gulp.task('cleanbuild', (cb) => seq('clean', 'build', cb))

gulp.task('watch', () => gulp.watch('{src,test}/**/*', ['cleanbuild']))

gulp.task('default', ['cleanbuild'], () => gulp.start('watch'))
