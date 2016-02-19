var gulp = require('gulp');
var git = require('gulp-git');
//var sass = require('gulp-ruby-sass');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

gulp.task('default', function() {
    // place code for your default task here
});

gulp.task('commit', function () {
    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit('testing gulp commit'));
});

gulp.task('sass', function () {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest('./public/css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./scss/**/*.scss', ['sass']);
});