require('dotenv').config();
const fs = require('fs');
const glob = require('glob');
const http = require('http');
const { execSync, spawn } = require('child_process');
const ecstatic = require('ecstatic');
const gulp = require('gulp');

const lunr = require('lunr');
const { getDocuments } = require('./scripts/search');

const pug = require('pug');

const gutil = require('gulp-util');
const unzipper = require('unzipper');
const through = require('through');
const livereload = require('livereload');

const stylus = require('gulp-stylus');
const plumber = require('gulp-plumber');
const autoprefixer = require('autoprefixer-stylus');

const yaml = require('js-yaml');
const frontMatter = require('front-matter');

const layout = require('./scripts/layout');
const tree = require('./scripts/tree');
const applyAtRules = require('./scripts/at-rules');
const util = require('./scripts/util');
const md = require('./scripts/md');
const { DOCS_DIR, DIST_DIR } = require('./config');

let routeBasePath = `${DOCS_DIR}/routes`;

const SEARCH_FILE_NAME = 'search.json';

const paths = {
  build: DIST_DIR,
  tree: routeBasePath + '/**/tree',
  js: [DOCS_DIR + '/js/**/*.js', DOCS_DIR + '/bundle.js'],
  css: DOCS_DIR + '/styles/app.styl',
  routes: routeBasePath + '/**/*.md',
  lib: DOCS_DIR + '/scripts/lib/*.js',
  inline: [DOCS_DIR + '/scripts/triggers/*.js'],
  partials: [DOCS_DIR + '/partials/*.md'],
  templates: [DOCS_DIR + '/layouts/*.pug', DOCS_DIR + '/partials/*.pug'],
  layout: {
    side: DOCS_DIR + '/layouts/sidebar.pug',
    post: DOCS_DIR + '/layouts/post.pug',
  },
};

// removes index.md from end
const fileurl = (module.exports.fileurl = (file) =>
  file.relative.replace(/\/?(index)?\.md$/, ''));

var lrscript = '';
if (process.argv[process.argv.length - 1] === 'watch') {
  let lrserver = livereload.createServer();
  lrserver.watch(__dirname + '/docs');
  lrscript = `<script src="http://localhost:${lrserver.config.port}/livereload.js?snipver=1"></script>`;
}

const search = {
  source: [],
};

function compilePosts(cb, changed) {
  var nowDate = new Date();
  var globalTreeMap = {};
  glob.sync(paths.tree).forEach((filePath) => {
    tree.add(globalTreeMap, filePath);
  });

  var relevant;
  if (changed) {
    var curUrl = fileurl({ relative: changed.replace(/^src\/routes\//, '') });
    relevant = [curUrl];
    gutil.log(`Compiling ${curUrl}`);
    for (var i in globalTreeMap) {
      if (i === curUrl) {
        relevant = globalTreeMap[i].list.map((t) => t.url);
      }
    }
  }

  return (
    gulp
      .src(paths.routes)
      .pipe(plumber())
      /*
       ** Render markdown
       ** and perform custom markdown operations
       */
      .pipe(
        through(function (file) {
          const isProd = process.env.NODE_ENV === 'prod';
          md.currentFile = file;
          var anchors = (file.anchors = []);
          var languages = (file.languages = []);
          file.openTags = {};
          file.radioCount = 0;
          file.slugs = {};

          var fileUrl = (file.fileUrl = fileurl(file));
          if (relevant && relevant.indexOf(fileUrl) === -1) {
            // do not process this file
            return;
          }
          var fm = frontMatter(String(file.contents));
          file.frontMatter = fm.attributes;

          // sidebar and title attributes are defined in "node"
          var node = globalTreeMap[fileUrl];
          if (node) {
            file.node = node;
            file.frontMatter = Object.assign(
              file.frontMatter,
              node.treetributes
            );
          }

          file.contents = Buffer.from(
            md.render(applyAtRules(fm.body, md)) +
              md.closeTag('article') +
              lrscript
          );

          delete file.openTags;
          delete file.radioCount;
          delete file.slugs;
          md.currentFile = null;

          if (!changed && fm.attributes.index !== false) {
            search.source = search.source.concat(
              getDocuments(file, applyAtRules(fm.body, md))
            );
          }
          this.emit('data', file);
        })
      )

      /* generate sidebar hierarchy for multipage documentation */
      .pipe(tree(globalTreeMap))

      /* apply pug layout on each, yield content
       also does logo.html → logo/index.html */
      .pipe(layout(paths.layout.post))
      .pipe(gulp.dest(paths.build))
      .on('finish', () => {
        // function trimmer(token) {
        //   return token.update(function (str, metadata) {
        //     return str
        //     .replace(/\W/g, '')
        //   })
        // };

        // lunr.Pipeline.registerFunction(trimmer, 'trimmer');
        // lunr.Pipeline.registerFunction(lunr.stopWordFilter, 'stopWordFilter');

        const idx = lunr(function () {
          // this.pipeline.reset();
          // this.pipeline.add(
          //   trimmer,
          //   lunr.stopWordFilter,
          //   lunr.stemmer
          // )
          this.field('title', { boost: 10 });
          this.field('head', { boost: 5 });
          this.field('body');
          this.metadataWhitelist = ['position'];
          search.source.forEach((s, i) => {
            s.id = i;
            this.add(s);
          });
        });
        search.index = idx;
        fs.writeFileSync(
          `${paths.build}/${SEARCH_FILE_NAME}`,
          JSON.stringify(search)
        );
        gutil.log('Done after', new Date() - nowDate, 'ms');
      })
  );
}
gulp.task('posts', compilePosts);

gulp.task('css', () =>
  gulp
    .src(paths.css)
    .pipe(plumber())
    .pipe(
      stylus({
        'include css': true,
      })
    )
    .pipe(gulp.dest(paths.build))
);

gulp.task('css:prod', () =>
  gulp
    .src(paths.css)
    .pipe(
      stylus({
        'include css': true,
        compress: true,
        use: [autoprefixer()],
      })
    )
    .pipe(gulp.dest(paths.build))
);

gulp.task('js', (done) => {
  spawn('./node_modules/.bin/rollup', ['-c'], { stdio: 'inherit' });
  done();
});

var sitePath = '../razorpay.com';
gulp.task('clean', (done) => {
  execSync(
    `rm -rf ${DIST_DIR}/assets; mkdir -p ${DIST_DIR}; cp -r ${DOCS_DIR}/assets ${DIST_DIR}/assets`
  );
  done();
});

gulp.task('unzip', (done) => {
  glob(routeBasePath + '/**/*.zip', function (er, files) {
    files.forEach((f) =>
      fs.createReadStream(f).pipe(
        unzipper.Extract({
          path: f.replace(/\.zip$/, '').replace(routeBasePath, paths.build),
        })
      )
    );
  });
  done();
});

gulp.task('redirects', (done) => {
  const redirects = yaml.load(fs.readFileSync(`${DOCS_DIR}/redirects.yml`));
  Object.keys(redirects).forEach((origin) => {
    const url = new URL('https://razorpay.com/docs/' + redirects[origin]);
    const html = `<html><head><meta http-equiv="refresh" content="0;URL=${url}"/></head></html>`;
    execSync(`mkdir -p ${DIST_DIR}/${origin}/`);
    fs.writeFileSync(`${DIST_DIR}/${origin}/index.html`, html);
  });
  done();
});

gulp.task(
  'default',
  gulp.series('clean', 'posts', 'css:prod', 'js', 'unzip', 'redirects')
);
gulp.task(
  'watch',
  gulp.series('default', (done) => {
    http.createServer(ecstatic({ root: __dirname })).listen(8080);

    execSync(
      `rm -rf ${DIST_DIR}/assets; ln -s ${DOCS_DIR}/assets ${DIST_DIR}/assets`
    );
    var watcher = gulp.watch(paths.routes);
    watcher.on('change', (path) => compilePosts(null, path));
    watcher.on('add', (path) => compilePosts(null, path));
    gulp.watch(paths.tree, gulp.series('posts'));
    gulp.watch(paths.templates, gulp.series('posts'));
    gulp.watch(paths.inline, gulp.series('posts'));
    gulp.watch(paths.partials, gulp.series('posts'));
    gulp.watch(`${DOCS_DIR}/styles/**/*.styl`, gulp.series('css'));
    spawn('./node_modules/.bin/rollup', ['-cw']).stderr.on('data', (data) => {
      gutil.log(
        String(data)
          .split('\n')
          .filter((_) => _)
          .join('\n')
      );
    });
    done();
  })
);
