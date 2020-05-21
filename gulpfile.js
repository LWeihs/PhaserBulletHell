const gulp = require('gulp');
const {makeSafeGlob, bundleScripts} = require('./gulp_tasks/scripts');

const src_folder = 'src/js';
const main_file = 'index.js';
const dist_folder = 'dist';
const bundle_name = 'bullet_hell';

gulp.task('scripts', bundleScripts(src_folder, main_file, dist_folder,
    bundle_name, gulp));
const fileGlob = makeSafeGlob(src_folder);
console.log(fileGlob);
gulp.task('watch', () => {
    gulp.watch(fileGlob, gulp.series('scripts'));
});
gulp.task('default', gulp.series('scripts', 'watch'));