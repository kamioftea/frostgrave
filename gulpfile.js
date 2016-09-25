const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const merge = require('merge-stream');
const path = require('path');
const rename = require('gulp-rename');
const source_maps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const webpack = require('webpack-stream');

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
        ],
        // Destination is outside node route so we override the
        // current working directory limit
        {force: true}
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

gulp.task('build', ['react']);

gulp.task('watch', ['build'], function () {
   gulp.watch(path.join(paths.scripts_react_root, '/**/*.jsx'), ['react']);
});

gulp.task('default', ['watch']);
