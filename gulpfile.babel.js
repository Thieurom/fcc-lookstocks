'use strict';

import gulp from 'gulp';
import browserSync from 'browser-sync';
import runSequence from 'run-sequence';
import gulpLoadPlugins from 'gulp-load-plugins';


const $ = gulpLoadPlugins();
const bs = browserSync.create();


// Nodemon
gulp.task('nodemon', cb => {
    let hasStarted = false;

    return $.nodemon({ script: 'server/server.js' }).on('start', () => {
        if (!hasStarted) {
            hasStarted = true;
            cb();
        }
    });
});


// Build HTML files
gulp.task('buildHTML', () => {
    return gulp.src('client/app/templates/index.pug')
        .pipe($.pug({ pretty: true }))
        .pipe(gulp.dest('client/app'));
});


// Compile stylesheets
gulp.task('styles', () => {
    return gulp.src('client/app/sass/*.sass')
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            outputStyle: 'expanded',
            precision: 10
        }).on('error', $.sass.logError))
        .pipe($.autoprefixer({ browers: ['>1%'] }))
        .pipe($.sourcemaps.write('./'))
        .pipe(gulp.dest('client/.tmp/styles'))
        .pipe(bs.stream());
});


// Transpile, concat and minify JavaScript
gulp.task('scripts', () => {
    return gulp.src([
        'client/app/js/main.js'
    ])
        .pipe($.sourcemaps.init())
        // .pipe($.concat('main.js'))
        .pipe($.babel())
        // .pipe($.iife({ useStrict: false }))
        .pipe($.sourcemaps.write('./'))
        .pipe(gulp.dest('client/.tmp/scripts'));
});


// Browser Sync
gulp.task('browserSync', () => {
    bs.init({
        proxy: 'http://localhost:3000',
        port: 5000
    });
});


// Watch and serve the output from app directory
gulp.task('serve', ['buildHTML', 'styles', 'scripts'], (cb) => {
    runSequence(
        'nodemon',
        'browserSync',
        cb
    );
    gulp.watch('client/app/templates/index.pug', ['buildHTML', bs.reload]);
    gulp.watch('client/app/sass/*.sass', ['styles']);
    gulp.watch('client/app/js/*.js', ['scripts', bs.reload]);
});