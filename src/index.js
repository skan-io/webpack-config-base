/* eslint-env node */
/* eslint no-console: 0 */
/* eslint max-params: 0 */

import {resolve, relative, basename, dirname} from 'path';
import ReactEntryLoaderPlugin from 'react-entry-loader/plugin';
import reactEntry from 'react-entry-loader/entry';
// eslint-disable-next-line
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';


export const getEntryOutputFile = (entryFile)=> {
  if (entryFile.endsWith('.js')) {
    entryFile = entryFile.substring(0, entryFile.lastIndexOf('.js'));
  } else {
    throw new Error('Must be a .html.js file');
  }

  if (entryFile.endsWith('.html')) {
    return entryFile;
  }

  throw new Error('Must be a .html.js file');
};

export const getEntries = (entryPoints, appUrl, version)=> {
  const entries = {};

  for (const entryPoint of entryPoints) {
    const entryFile = basename(entryPoint);
    const [entryKey] = entryFile.split('.');
    entries[entryKey] = [
      '@babel/polyfill',
      reactEntry({
        output: getEntryOutputFile(entryFile),
        appUrl,
        version
      })(`./src/${entryPoint}`)
    ];
  }

  return entries;
};

const getStyleModuleLoaders = (
    useSass, isProduction, sassRootTheme, useStyleModules
)=> {
  const cssStyleModuleLoaders = [
    MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        modules: useStyleModules,
        sourceMap: !isProduction,
        importLoaders: 2,
        localIdentName: '[name]_[local]_[hash:base64:5]',
        camelCase: true
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        /* istanbul ignore next */
        plugins: /* istanbul ignore next */ ()=> [
          /* istanbul ignore next */
          require('postcss-nested')({ /* options */ }),
          require('autoprefixer')
        ],
        sourceMap: !isProduction
      }
    }
  ];
  const sassStyleModuleLoaders = [
    {
      loader: 'sass-loader',
      options: {
        sourceMap: !isProduction,
        // adds app-theme overrides to component's custom themes
        data: `@import "src/${sassRootTheme}";`,
        includePaths: [
          resolve(process.cwd()),
          resolve(process.cwd(), './node_modules')
        ]
      }
    }
  ];

  if (useSass) {
    return [...cssStyleModuleLoaders, ...sassStyleModuleLoaders];
  }

  return cssStyleModuleLoaders;
};


/*
  NOTE that this webpack configuration currently only supports the new
  ReactEntryLoaderPlugin way of creating entry points and does not use
  HtmlWebpackPlugin.  Therefore all paths to entry files must be of format
  entry.html.js.
 */
export default (
    buildEntries, buildOutputPath, devServerPort, faviconPath,
    useSass=false, useStyleModules=true, jsxIncludePaths=['src'],
    sassRootTheme='theme.scss'
)=> (
    nodeEnv, deployUrl, deployPath, version
)=> {
  const isProduction = (nodeEnv === 'production');
  const appUrl = deployUrl;
  const cwd = process.cwd();

  console.log(`
    Running webpack with config from './build/config.json':
    NODE_ENV=${nodeEnv}
    version=${version}
    app-url=${appUrl}
  `);

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {...getEntries(buildEntries, appUrl, version)},

    output: {
      path: resolve(cwd, buildOutputPath),
      filename: '[name]-[contenthash].js',
      // improve paths in devtools
      /* istanbul ignore next */
      devtoolModuleFilenameTemplate: /* istanbul ignore next */ (info)=> (
        /* istanbul ignore next */
        `webpack:///${relative(cwd, info.absoluteResourcePath)}`
      )
    },

    optimization: {
      minimize: isProduction,
      runtimeChunk: {name: 'runtime'},
      splitChunks: {
        chunks: 'all',
        name: !isProduction,
        cacheGroups: {
          default: false,
          react: {
            test: /[\\/]node_modules[\\/]react/,
            name: 'react',
            chunks: 'all'
          },
          styles: {
            // workaround for dynamically loading components.
            // make sure we only have a single CSS chunk
            minSize: 0,
            test: /\.s?css$/,
            name: 'styles'
          }
        }
      }
    },

    plugins: [
      new ReactEntryLoaderPlugin(),
      new CopyWebpackPlugin([{from: `src/${faviconPath}`}]),
      new MiniCssExtractPlugin({chunkFilename: '[name]-[contenthash].css'})
    ],

    module: {
      rules: [{
        test: useSass ? /(\.scss|\.css)$/ : /(\.css)$/,
        use: getStyleModuleLoaders(
          useSass, isProduction, sassRootTheme, useStyleModules
        )
      },
      {
        test: /\.(png|jpg|svg|ico|gif)$/,
        loader: 'url-loader?limit=1'
      }, {
        test: /\.jsx?$/,
        include: jsxIncludePaths.map(
          (modulePath)=> resolve(cwd, modulePath)
        ),
        loader: 'babel-loader',
        options: {
          // making sure babel gets the right environment and thus
          // picks up the correct config.
          envName: nodeEnv
        }
      }]
    },

    devtool: isProduction ? false : '#cheap-module-source-map',

    devServer: {
      port: devServerPort,
      host: '0.0.0.0',
      inline: true,
      stats: 'minimal',
      contentBase: `./${dirname(buildOutputPath)}`,
      publicPath: `/${deployPath}/`,
      historyApiFallback: {
        rewrites: [
          {from: /^\/$/, to: `/${deployPath}/`}
        ]
      }
    }
  };
};
