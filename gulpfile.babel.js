import gulp from 'gulp'
import loadPlugins from 'gulp-load-plugins'
import {Instrumenter} from 'isparta'
import del from 'del'
import seq from 'run-sequence'

const COVERAGE_THRESHOLDS = {global: 100}

const $ = loadPlugins()

const plumb = () => $.if(!process.env.CI, $.plumber({
  errorHandler: $.notify.onError('<%= error.message %>')
}))

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
    .pipe($.standard.reporter('default', {breakOnError: false}))
})

gulp.task('pre-coverage', () => {
  return gulp.src('src/**/*.js')
    .pipe($.istanbul({instrumenter: Instrumenter}))
    .pipe($.istanbul.hookRequire())
})

gulp.task('coverage', ['pre-coverage'], () => {
  return gulp.src(['test/lib/setup.js', 'test/{unit,integration}/**/*.js', '!**/_*.js'], {read: false})
    .pipe(plumb())
    .pipe($.mocha({reporter: 'spec'}))
    .pipe($.istanbul.writeReports())
    .pipe($.istanbul.enforceThresholds({thresholds: COVERAGE_THRESHOLDS}))
})

gulp.task('test', (cb) => seq('lint', 'coverage', cb))

gulp.task('coveralls', () => {
  return gulp.src('coverage/lcov.info')
    .pipe($.coveralls())
})

gulp.task('build', (cb) => seq('test', 'clean', 'transpile', cb))

gulp.task('watch', () => gulp.watch('{src,test}/**/*', ['build']))

gulp.task('default', ['build'], () => gulp.start('watch'))
