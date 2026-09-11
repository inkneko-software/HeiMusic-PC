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
        destination: 'http://localhost:8081/api/:path*',
      },
      // 后端服务的静态资源（avatarUrl 的 /public/images/...），
      // 前缀表需与生产 nginx 及 Electron 壳层代理（main/background.ts 的 BACKEND_PATH_PREFIXES）一致
      {
        source: '/public/:path*',
        destination: 'http://localhost:8081/public/:path*',
      },
    ]
  },
};



