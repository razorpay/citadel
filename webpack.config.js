const path = require("path");
const glob = require("glob").sync;
const webpack = require("webpack");
const assert = require("assert");
const DirectoryNamedWebpackPlugin = require("directory-named-webpack-plugin");
const vendor = require("./scripts/vendor");
const isProdEnv = process.env.NODE_ENV === "production";
const babelLoader = require("./scripts/babel")(isProdEnv);

module.exports = {
  loaders: {
    babel: babelLoader
  },
  config: (overrides, moreOptions = {}) => {
    assert(overrides && typeof overrides === "object");
    assert(overrides.entry);
    assert(overrides.output && overrides.output.path);

    const mode = overrides.mode || isProdEnv ? "production" : "development";
    overrides.mode = mode;
    const isProdMode = mode === "production";
    const cssLoader = [
      {
        loader: "style-loader",
        options: {
          hmr: !isProdMode
        }
      },
      {
        loader: "css-loader",
        options: {
          url: false
        }
      }
    ];

    const config = Object.assign(
      {
        externals: vendor(overrides, moreOptions),

        plugins: [
          new webpack.DefinePlugin({
            ENV_PROD: isProdMode,
            useState: "React.useState",
            useEffect: "React.useEffect",
            useMemo: "React.useMemo",
            useCallback: "React.useCallback",
            useRef: "React.useRef",
            useContext: "React.useContext"
          }),

          new webpack.ProvidePlugin({
            util: "util"
          })
        ],

        resolve: {
          alias: {
            rc: __dirname + "/src/components",
            hooks: __dirname + "/src/hooks",
            util: __dirname + "/src/util"
          },
          modules: ["node_modules", "node_modules/react-common/node_modules"],
          plugins: [
            // import 'dir/foo' → dir/foo/foo.js
            // passing true to look for index.js first
            new DirectoryNamedWebpackPlugin(true)
          ]
        },

        devServer: {
          port: 9999,
          compress: true,
          disableHostCheck: true,
          contentBase: overrides.output.path
        },

        module: {
          rules: [
            {
              test: /\.js$/,
              exclude: /node_modules/,
              use: [babelLoader, "react-hot-loader/webpack"]
            },
            {
              test: /\.font\.js$/,
              use: cssLoader.concat({
                loader: "webfonts-loader",
                options: {
                  classPrefix: "Icon-",
                  baseSelector: ".Icon"
                }
              })
            },
            {
              test: /\.css$/,
              use: cssLoader
            },
            {
              test: /\.sss$/,
              use: cssLoader.concat([
                {
                  loader: "postcss-loader",
                  options: {
                    parser: "sugarss",
                    plugins: [
                      require("postcss-import")({
                        resolve: (id, basedir, importOptions) => {
                          return glob(path.join(basedir, id));
                        }
                      }),
                      require("postcss-simple-vars"),
                      require("postcss-nested")(),
                      require("postcss-property-lookup")()
                    ]
                  }
                }
              ])
            }
          ]
        }
      },
      overrides
    );
    return config;
  },

  logger: (err, stats) => {
    if (err) {
      console.error(err);
    } else {
      console.log(stats.toString({ colors: true }));
    }
  }
};
