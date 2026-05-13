const path = require('path');
const nodeExternals = require('webpack-node-externals');

const appNodeModules = path.resolve(__dirname, 'node_modules');
const rootNodeModules = path.resolve(__dirname, '../../node_modules');

module.exports = (options) => {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        '@bakery/db/schema': path.resolve(__dirname, '../../packages/db/src/schema/index.ts'),
        '@bakery/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: path.resolve(__dirname, 'tsconfig.json'),
                allowTsInNodeModules: true,
              },
            },
          ],
          exclude: /node_modules\/(?!@bakery)/,
        },
      ],
    },
    externals: [
      nodeExternals({
        allowlist: [/^@bakery\//],
        modulesDir: appNodeModules,
      }),
      nodeExternals({
        allowlist: [/^@bakery\//],
        modulesDir: rootNodeModules,
      }),
    ],
  };
};
