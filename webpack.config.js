const path = require('path');
const mode1 = process.env.NODE_ENV || 'development';
module.exports = {
  entry: './instrumented/src/index.tsx',
  mode: mode1,
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};