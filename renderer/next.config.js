const path = require('path');
const { env } = require('process');

// 开发态 /api、/public 的转发端点：读取仓库根目录 api-server.json（不入库，
// 模板见 api-server.json.example），与 Capacitor 原生端（renderer/lib/apiServer.ts、
// android/app/build.gradle）读取同一份文件；缺失时回落本地后端默认地址
let apiServer = 'http://localhost:8081';
try {
  apiServer = require(path.join(__dirname, '..', 'api-server.json')).apiServer;
} catch (e) {
  console.warn('[next.config.js] 未找到仓库根目录 api-server.json，开发转发回落到 http://localhost:8081（模板见 api-server.json.example）');
}

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
        destination: `${apiServer}/api/:path*`,
      },
      // 后端服务的静态资源（/public/...），
      // 前缀表需与生产 nginx 及 Electron 壳层代理（main/background.ts 的 BACKEND_PATH_PREFIXES）一致
      {
        source: '/public/:path*',
        destination: `${apiServer}/public/:path*`,
      },
    ]
  },
};



