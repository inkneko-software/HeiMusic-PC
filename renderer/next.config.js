const path = require('path');
const { env } = require('process');
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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost/api/:path*',
      },
    ]
  },
};



