const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
              test: /\.(s?)css$/,
              use: [
                MiniCssExtractPlugin.loader,
                "css-loader",
                "sass-loader"
              ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    'file-loader',
                ],
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist'
    },
    plugins: [
        new MiniCssExtractPlugin({
        }),
        new CopyPlugin([
          { from: './src/assets/*' },
          { from: './src/qrcode-web-worker.js' },
          { from: './src/service-worker.js' },
          { from: './src/manifest.json' },
        ]),
        new CleanWebpackPlugin(['dist']),
        new HtmlWebpackPlugin({
            template: 'src/assets/template.html'
        })
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};