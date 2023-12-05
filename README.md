HeiMusic cross-platform PC client.
---

使用 electron + next.js + typescript 实现

### swagger / openapi
本项目使用了swagger

在构建前请确保`package.json`中openapi项指定的swagger host为正确的地址

并执行`npm run openapi`进行前端fetch代码的生成

### 开发和构建

```
#安装依赖
npm install
#构建
npm run build
#开发
npm run dev
```

### 网页端

本项目可直接使用浏览器访问。

非electron环境时，api请求默认使用前端页面的同host。

请确保`renderer/next.config.js`中api服务器指向正确，以使得nodejs server能够正确转发请求

```
#编译
npx next build renderer
#运行
npx next start renderer
```

### RoadMap

### 0.2.x

当前版本

0.2.4

- 首页
  - [ ] 管理账户的创建
- 专辑页面
  - [ ] 对接音乐收藏
- 音乐收藏页面
  - [ ] 实现音乐收藏页面
- 歌单页面
  - [ ] 实现歌单页面
- 设置页面
  - [ ] API服务器的设置
- 其他
  - [x] 修复标题显示。若当前正在播放，则标题始终为当前音乐的名称
---

0.2.3 

- 设置页面
  - [x] API服务器的地址显示
- 专辑页面
  - [x] 音乐时长数据对接
  - [x] 显示优化，下滑弹出专辑信息悬浮窗口
- 专辑管理
  - [x] 专辑信息编辑
  - [x] 音乐上传进度
- 窗口控制
  - [x] 最大化，最小化窗口
- 图片显示
- [x] 首页、专辑管理页面的封面图片对接压缩功能