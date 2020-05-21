const rollup = require('rollup');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify-es').default;
const path = require('path');

function joinPathToDrawer(dest_dir) {
    return path.join(__dirname, '..', dest_dir);
}

//to establish watch task
function makeSafeGlob(src_folder) {
    const src_path = joinPathToDrawer(src_folder);
    const unsafe_glob = path.join(src_path, '**', '*.js'); //bad on Windows
    console.log('UNSAFE GLOB')
    console.log(unsafe_glob)
    const safe_glob = unsafe_glob.split(path.sep).join('/');
    return [safe_glob];
}

//to bundle js files together
function bundleScripts(src_folder, main_file, dist_folder, bundle_name, gulp) {
    const src_path = joinPathToDrawer(src_folder);
    const main_file_path = path.join(src_path, main_file);
    const dist_path = joinPathToDrawer(dist_folder);
    const res_file_path = path.join(dist_path, `${bundle_name}.js`);
    return async () => {
        try {
            //bundle into module using rollup
            const bundle = await rollup.rollup({
                input: main_file_path,
            });
            await bundle.write({
                file: res_file_path,
                format: 'umd',
                name: 'blabla',
            });
            //minify bundled file
            gulp.src(res_file_path)
                .pipe(rename(`${bundle_name}.min.js`))
                .pipe(uglify())
                .pipe(gulp.dest(dist_path));
        } catch (e) {
            console.log(e);
        }
    };
}

module.exports = {
    makeSafeGlob,
    bundleScripts,
};