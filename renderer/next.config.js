const path = require('path');

module.exports = {
  webpack: (config, { isServer }) => {
    config.resolve.alias['@components'] = path.join(__dirname, 'components');
    config.resolve.alias['@api'] = path.join(__dirname, 'api');

    // if (!isServer) {
    //   config.target = 'electron-renderer';
    //   config.node = {
    //     __dirname: true,
    //   };
    // }
    // config.output.globalObject = 'this';
    return config;
  },
};