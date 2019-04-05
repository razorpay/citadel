const fs = require("fs");
const gaze = require("gaze");
const postcss = require("postcss");
const webpack = require("react-common/webpack.config.js");
const parser = require("sugarss");
const chalk = require("chalk");
const path = require("path");
const log = console.log;

require("child_process").execSync(`
  rm -rf server/*.{js,css}
  cp octokit-rest.min.js server/
`);

const config = webpack.config({
  entry: "./src/App.js",
  output: {
    path: __dirname + "/server",
    filename: "bundle.js"
  }
});

config.resolve.modules.push("src");

module.exports = config;

const cssFiles = "src/styles/**/*.sss";
const docsCss = `@import '${cssFiles}'`;
const cssOutput = "server/docs.css";

config.module.rules.find(r => {
  if (Array.isArray(r.use)) {
    const postcssLoader = r.use.find(r => r.loader === "postcss-loader");
    if (postcssLoader) {
      function generateCss() {
        postcss(postcssLoader.options.plugins)
          .process(docsCss, { parser, from: "docs.css" })
          .then(result => {
            fs.writeFileSync(cssOutput, result.css);
            log(chalk.gray("generated " + cssOutput));
          })
          .catch(e => {
            if (!e.reason) {
              return log(chalk.red(e.message));
            }
            let reason = chalk.red(e.reason);
            if (e.file) {
              reason += chalk.red(" in ") + path.basename(e.file);
            }
            if (e.source) {
              const source = e.source.split("\n");
              reason +=
                "\n" +
                [
                  chalk.gray(source[e.line - 2] || ""),
                  chalk.red(source[e.line - 1]),
                  chalk.gray(source[e.line] || "")
                ]
                  .filter(_ => _)
                  .join("\n");
            }
            log(reason);
          });
      }

      generateCss();
      gaze(cssFiles, (err, watcher) => {
        watcher.on("all", (event, filepath) => {
          generateCss();
        });
      });
    }
  }
});
