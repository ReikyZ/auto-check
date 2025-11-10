const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.js',
    content: './content.js',
    popup: './src/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      // 暂时跳过babel处理，直接使用原生JS
      // {
      //   test: /\.js$/,
      //   exclude: /node_modules/,
      //   use: {
      //     loader: 'babel-loader',
      //     options: {
      //       presets: [['@babel/preset-env', {
      //         targets: {
      //           browsers: ['last 2 versions', 'not ie <= 11']
      //         }
      //       }]]
      //     }
      //   }
      // },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup.html', to: 'popup.html' },
        { from: 'styles.css', to: 'styles.css' },
        { from: 'icons', to: 'icons' },
        { from: 'libs', to: 'libs' },
        { from: 'src/metrics', to: 'metrics' },
        { from: 'src/issue-rules.js', to: 'src/issue-rules.js' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.json']
  },
  devtool: 'source-map'
};

