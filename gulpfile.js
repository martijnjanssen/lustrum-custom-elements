/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at
http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at
http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at
http://polymer.github.io/PATENTS.txt
*/
'use strict';

const path = require('path');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const babel = require('gulp-babel')
const cssSlam = require('css-slam').gulp;
const htmlMinifier = require('gulp-html-minifier');
const jshint = require('gulp-jshint');

// Got problems? Try logging 'em
// const logging = require('plylog');
// logging.setVerbose();

// Add your own custom gulp tasks to the gulp-tasks directory
// A few sample tasks are provided for you
// A task should return either a WriteableStream or a Promise
const clean = require('./gulp-tasks/clean.js');
const project = require('./gulp-tasks/project.js');

function minify() {
  return htmlMinifier({
    collapseWhitespace : true,
    removeComments : true,
    removeAttributeQuotes : true,
    removeRedundantAttributes : true,
    useShortDoctype : true,
    removeEmptyAttributes : true,
    removeScriptTypeAttributes : true,
    removeStyleLinkTypeAttributes : true,
    removeOptionalTags : true
  });
}

// The source task will split all of your source files into one
// big ReadableStream. Source files are those in src/** as well as anything
// added to the sourceGlobs property of polymer.json.
// Because most HTML Imports contain inline CSS and JS, those inline resources
// will be split out into temporary files. You can use gulpif to filter files
// out of the stream and run them through specific tasks. An example is provided
// which filters all images and runs them through imagemin
function source() {
  return project.splitSource()
      // Add your own build tasks here!
      .pipe(gulpif(/\.js$/, babel({presets: ['babili']})))
      .pipe(gulpif(/\.css$/, cssSlam()))
      .pipe(gulpif(/\.html$/, cssSlam()))
      .pipe(gulpif(/\.html$/, minify()))
      .pipe(project.rejoin());
}

// The dependencies task will split all of your bower_components files into one
// big ReadableStream
// You probably don't need to do anything to your dependencies but it's here in
// case you need it :)
function dependencies() {
  return project.splitDependencies()
      .pipe(gulpif(/\.js$/, babel({presets: ['babili']})))
      .pipe(gulpif(/\.css$/, cssSlam()))
      .pipe(gulpif(/\.html$/, cssSlam()))
      .pipe(gulpif(/\.html$/, minify()))
      .pipe(project.rejoin());
}

const scaffoldIndexes = require('./gulp-tasks/scaffold-indexes.js');

gulp.task('scaffold-indexes', gulp.series([
  clean([ 'index-build' ]),
  scaffoldIndexes.scaffold
]));

const optimizeImages = require('./gulp-tasks/optimize-images.js');

// Optimize images with ImageOptim
// Run with `yarn run build optimize-images`
gulp.task('optimize-images', optimizeImages.optimizeImages);
gulp.task('ensure-images-optimized', optimizeImages.ensureOptimizeImages);

function linter() {
  return gulp.src([ 'scripts/**/*.js',
                    'src/**/*.html' ])
      .pipe(jshint.extract()) // Extract JS from .html files
      .pipe(jshint())
      .pipe(jshint.reporter('jshint-stylish'));
}

// Clean the build directory, split all source and dependency files into streams
// and process them, and output bundled and unbundled versions of the project
// with their own service workers
gulp.task('default', gulp.series([
  clean([ 'build', 'index-build' ]),
  scaffoldIndexes.scaffold,
  project.merge(source, dependencies), project.serviceWorker,
  scaffoldIndexes.mergeIntoBuild,
  clean([ path.resolve('build', 'index-build'), 'index-build' ])
]));
