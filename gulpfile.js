const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const merge = require('merge-stream');
const path = require('path');
const rename = require('gulp-rename');
const source_maps = require('gulp-sourcemaps');
//const uglify = require('gulp-uglify');
const webpack = require('webpack-stream');
const googleWebFonts = require('gulp-google-webfonts');

const paths = require('./paths.js');

function getFolders(dir) {
    return fs.readdirSync(dir)
        .filter(function (file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
}

gulp.task('clean', function () {
    return del(
        [
            paths.scripts_destination,
            paths.fonts_destination
        ]
    );
});

gulp.task('react', function () {
    var modules = getFolders(paths.scripts_react_root).map(function (folder) {
        const  root_file = path.join(paths.scripts_react_root, folder, paths.scripts_react_filename);

        return gulp.src(root_file)
            .pipe(source_maps.init())
            .pipe(webpack( require('./webpack.config.js')))
            //.pipe(uglify())
            .pipe(rename(folder + '.min.js'))
            .pipe(source_maps.write('.'))
            .pipe(gulp.dest(paths.scripts_destination));
    });

    return merge(modules)
});

gulp.task('fonts', function () {
    const nodeFonts = gulp.src(paths.fonts)
        .pipe(gulp.dest(paths.fonts_destination));

    const webFontsWoff = gulp.src(paths.fonts_list)
        .pipe(googleWebFonts())
        .pipe(gulp.dest(paths.fonts_destination));

    const webFontsTtf = gulp.src(paths.fonts_list)
        .pipe(googleWebFonts({format: 'ttf'}))
        .pipe(gulp.dest(paths.fonts_destination));

    return merge(nodeFonts, webFontsWoff, webFontsTtf)
});

gulp.task('build', ['react', 'fonts']);

gulp.task('watch', ['build'], function () {
   gulp.watch(path.join(paths.scripts_react_root, '/**/*.jsx'), ['react']);
});

gulp.task('default', ['watch']);
