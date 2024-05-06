FROM node:16-alpine

COPY . /app

WORKDIR /app

# ENV npm_config_registry=https://registry.npmmirror.com
# ENV npm_config_sass_binary_site=https://npm.taobao.org/mirrors/node-sass/
# ENV npm_config_phantomjs_cdnurl=http://npm.taobao.org/mirrors/phantomjs
# ENV npm_config_ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
# ENV npm_config_electron_builder_binaries_mirror=http://npm.taobao.org/mirrors/electron-builder-binaries/

RUN npm install
RUN npx next build renderer

CMD [ "npx", "next", "start", "renderer" ]