var gulp = require('gulp');
var git = require('gulp-git');
//var sass = require('gulp-ruby-sass');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var uglify = require('gulp-uglifyjs');

gulp.task('default', function() {
    // place code for your default task here //
});

gulp.task('commit', function () {
    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit('gulp commit'));
        //.pipe(git.push('origin', 'master'));
});

gulp.task('sass', function () {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest('./public/css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./scss/**/*.scss', ['sass']);
});

// watch files for changes and reload
gulp.task('serve', function() {
    browserSync({
        server: {
            baseDir: 'public'
        }
    });

    gulp.watch(['*.html', 'styles/**/*.css', 'scripts/**/*.js'], {cwd: 'public'}, reload);
});

var files = [
    'js/ng-file-upload-all.min.js',
    'js/mainController.js',
    'js/whiteboardController.js'
];

gulp.task('uglify', function() {
    gulp.src(files)
        .pipe(uglify('app.js', {
            mangle: false
            //output: {
            //    beautify: true
            //}
        }))
        .pipe(gulp.dest('public/js'))
});