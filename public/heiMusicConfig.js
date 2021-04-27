const fs = require("fs")
const {app} = require("electron")

var configPath = `${app.getPath("home")}/.heimusic/config.json`
var historyPath = `${app.getPath("home")}/.heimusic/playhistory.json`
var configJson = JSON.parse(fs.readFileSync(configPath))

exports.client_ua = "HeiMusic PC Client v0.1"
exports.login_uin = configJson.login_uin
exports.cookie = configJson.cookie
exports.ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36"
exports.downloadRootPath = configJson.downloadRootPath
exports.last = configJson.last
exports.getHistory = function(){
    try {
        let data = JSON.parse(fs.readFileSync(historyPath))
        let history = {}
        history.tid = data.tid
        history.playlist = data.playlist
        history.index = data.index
        history.playedTime = data.playedTime
        return history
    } catch (error) {
        return null
    }
}
exports.saveHistory = function(tid, playlist, index, playedTime){
    let history = {}
    history.tid=tid
    history.playlist = playlist
    history.index=index
    history.playedTime=playedTime
    fs.writeFileSync(historyPath, JSON.stringify(history, null, '\t'))
}
