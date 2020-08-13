const env = require('process').env;
import buble from 'rollup-plugin-buble';
import include from 'rollup-plugin-includepaths';
import { uglify } from 'rollup-plugin-uglify';
import alias from 'rollup-plugin-alias';
import commonjs from 'rollup-plugin-commonjs';
const { DOCS_DIR, DIST_DIR } = require('./config');

var plugins = [
  include({
    paths: [DOCS_DIR + '/js'],
  }),

  buble(),

  alias({
    jquery: 'node_modules/jquery/dist/jquery.min.js',
  }),

  commonjs(),
];

if (env.NODE_ENV === 'prod') {
  plugins.push(uglify());
}

export default {
  input: `${DOCS_DIR}/app.js`,
  output: {
    format: 'iife',
    file: `${DIST_DIR}/app.js`,
    name: 'window',
  },
  plugins,
};
