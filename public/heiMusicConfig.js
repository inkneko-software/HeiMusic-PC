const fs = require("fs")
const {app} = require("electron")


var configPath = `${app.getPath("home")}/.heimusic/config.json`
var historyPath = `${app.getPath("home")}/.heimusic/playhistory.json`
var configJson = {
    login_uin: 10000,
    cookie: "",
    downloadRootPath: `${app.getPath("home")}/.heimusic/`,
    last: null
};

    
fs.accessSync(configPath, (error)=>{
    if (error){
        fs.mkdir(`${app.getPath("home")}/.heimusic/`, (error)=>{
            //TODO: error handling
        })
        fs.writeFile(configPath, JSON.stringify(configJson), {encoding: "utf-8"} ,(error)=>{
            //TODO: error handling
        })
    }
});

fs.readFile(configPath, {encoding: "utf-8"}, (error, data)=>{
    if (error){
        console.log(error);
    }
    configJson = JSON.parse(data);
})



exports.client_ua = "HeiMusic PC Client v0.1"
exports.login_uin = configJson.login_uin
exports.cookie = configJson.cookie
exports.ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36"
exports.downloadRootPath = configJson.downloadRootPath
exports.last = configJson.last


fs.accessSync(historyPath, (error)=>{
    if (error){
        fs.mkdir(`${app.getPath("home")}/.heimusic/`, (error)=>{
            //TODO: error handling
        })
        this.saveHistory(null, null, null, null);
    }
});

exports.getHistory = function(){
    let history = {}
    fs.readFile(historyPath, {encoding: "utf-8"}, (error, data)=>{
        if (error){
            console.log(error);
        }
        history.tid = data.tid
        history.playlist = data.playlist
        history.index = data.index
        history.playedTime = data.playedTime
    })

    return history
}

exports.saveHistory = function(tid, playlist, index, playedTime){
    let history = {}
    history.tid=tid
    history.playlist = playlist
    history.index=index
    history.playedTime=playedTime
    fs.writeFile(historyPath, JSON.stringify(history, null, '\t'), {encoding: "utf-8"}, (error)=>{{
        //TODO: error handling
    }})
}
