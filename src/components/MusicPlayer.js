import React from "react"
import Slider from "@material-ui/core/Slider"
import { withStyles, makeStyles } from '@material-ui/core/styles';
import "./css/MusicPlayer.css"
import  Avatar  from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button"
import IconButton from '@material-ui/core/IconButton';

import MusicNote from "@material-ui/icons/MusicNote"
import SkipPrevious from "@material-ui/icons/SkipPrevious"
import SkipNext from "@material-ui/icons/SkipNext"
import PlayCircleFilled from "@material-ui/icons/PlayCircleFilled"
import PauseCircleFilled from "@material-ui/icons/PauseCircleFilled"
import QueueMusic from "@material-ui/icons/QueueMusic"
import VolumeDown from "@material-ui/icons/VolumeDown"
import VolumeOff from "@material-ui/icons/VolumeOff"
import Repeat from "@material-ui/icons/Repeat"
import RepeatOne from "@material-ui/icons/RepeatOne"
import VolumePanel from "./VolumePanel";


const https = window.require("https")
const http = window.require("http")
const fs = window.require("fs")
const remote = window.require("electron").remote
const config = remote.require("./heiMusicConfig")
const ipcRenderer = window.require("electron").ipcRenderer;

const MusicSlider = withStyles({
    root: {
      color: '#52af77',
      marginTop: -3,
      paddingTop: 3,
      paddingBottom: 0,
      height: 2,
    },
    thumb: {
      height: 0,
      width: 0,
      backgroundColor: '#52af77',
      //border: '2px solid currentColor',
      marginTop: -4,
      marginLeft: -4,
      '&:focus, &:hover, &$active': {
        boxShadow: 'inherit',
      },
      display: "hidden"
    },
    active: {},
    valueLabel: {
      left: 'calc(-50% + 4px)',
    },
    track: {
      height: 2,
      borderRadius: 4,
    },
    rail: {
      height: 2,
      borderRadius: 4,
      opacity: 1,
      backgroundColor: "#e3e3e3"
    },
  })(Slider);


class MusicPlayer extends React.Component{
    constructor(props){
        super(props)
        this.audio = new Audio()
        this.audioInfo = {}
        this.state  = {
            progress: 0,
            music_cover_url: MusicNote.toString(),
            music_name: "墨猫音乐",
            music_singer: "author: inkneko.",
            playBtnIcon: <PlayCircleFilled style={{fontSize: 42}}/>,
            qulity: "",
            qulityColor: "black",
            volumePanelOpen: false,
            volume: 35
        }

        /* 播放列表信息维护 */
        this.playlist = []
        this.currentTid = null;
        this.currentPlayIndex = null
    }
    render(){
        return(
            <div className="music-player-panel">
                <MusicSlider value={this.state.progress} step={0.1} onChange={this.OnSliderChange.bind(this)} style={{width: "100%"}} />
                <div className="music-player-panel-wrapper">
                    <div className="music-info">
                        <Avatar className="music-player-album-cover" variant="square" src={this.state.music_cover_url}><MusicNote/></Avatar>
                        <div className="music-info-text-wrapper">
                            <div className="music-info-name">{this.state.music_name}</div>
                            <div className="music-info-singer">{this.state.music_singer}</div>
                        </div>
                    </div>
                    <div className="music-control">
                        <IconButton className="music_control-aside-btn"><Repeat style={{fontSize:24}}/></IconButton>
                        <IconButton className="music_control-skip-btn" onClick={this.PlayPrevious.bind(this)}><SkipPrevious style={{fontSize:34}}/></IconButton>
                        <IconButton className="music_control-play-btn" onClick={this.OnPauseEvent.bind(this)}>{this.state.playBtnIcon}</IconButton>
                        <IconButton className="music_control-skip-btn" onClick={this.PlayNext.bind(this)}><SkipNext style={{fontSize:34}}/></IconButton>
                        <VolumePanel open={this.state.volumePanelOpen} value={this.state.volume} onChange={this.OnVolumeSliderChange.bind(this)}/>
                        <IconButton className="music_control-volume-btn"  onClick={this.VolumePanelEvent.bind(this)}><VolumeDown style={{fontSize:24}}/></IconButton>
                    </div>
                    <div className="music-misc-panel">
                        <div className="misc-panel-duration">{this.state.durationLabel}</div>
                        <div className="misc-panel-qulity-info" style={{color: this.state.qulityColor}}>{this.state.qulity}</div>
                        <IconButton className="misc-panel-playing-list-btn"><QueueMusic style={{fontSize:24}}/></IconButton>
                    </div>
                </div>
            </div>
        )
    }

    componentDidMount(){
        window.addEventListener("MusicPlayerListener", this.MusicPlayerListener.bind(this))
        this.audio.onended = this.PlayEndEvent.bind(this)

        ipcRenderer.on("music-player-hotkey-callback",(event,data)=>{
            switch (data.action){
                case "pause":
                    this.OnPauseEvent()
                    break;
                case "next":
                    this.PlayNext()
                    break
                case "privious":
                    this.PlayPrevious()
                    break
            }
        })

        ipcRenderer.on("music-player-saveHistory-callback",(event,data)=>{
            config.saveHistory(this.currentTid, this.playlist, this.currentPlayIndex, this.audio.currentTime)
            ipcRenderer.sendSync('window-control', {action: "quit"})
        })

        let history = config.getHistory()/*
        if (history !== null){
            this.playlist = history.playlist
            this.currentTid = history.tid
            this.currentPlayIndex = history.index
            this.PlayMusic(this.playlist[this.currentPlayIndex], history.playedTime, false)
        }*/

        //播放本地文件
        // console.log(config.bin)
        // this.audio.src = "data:audio/mp3;base64,"+config.bin
        // console.log(this.audio.srcObject)
        // this.audio.play()
    }

    VolumePanelEvent(){
        this.setState({volumePanelOpen: !this.state.volumePanelOpen})
    }

    OnPauseEvent(){
        if (this.audio.src === ""){
            return
        }

        if (this.audio.paused === true){
            this.audio.play()
            this.setState({
                playBtnIcon: <PauseCircleFilled style={{fontSize: 42}}/>
            })
        }
        else{

            this.audio.pause()
            this.setState({
                playBtnIcon: <PlayCircleFilled style={{fontSize: 42}}/>
            })
        }
    }

    PlayPrevious(){
        if (this.currentTid == null){
            return
        }
        if (this.currentPlayIndex === 0){
            this.currentPlayIndex = this.playlist.length - 1
        }
        else{
            this.currentPlayIndex -= 1
        }
        
        this.PlayMusic(this.playlist[this.currentPlayIndex])
    }

    PlayNext(){
        if (this.currentTid == null){
            return
        }
        if (this.currentPlayIndex === this.playlist.length - 1 ){
            this.currentPlayIndex = 0
        }
        else{
            this.currentPlayIndex += 1
        }

        
        this.PlayMusic(this.playlist[this.currentPlayIndex])
    }

    MusicPlayerListener(event){
        /* 
        触发本事件时，应在event.info对象中携带以下数据：
        event = {
            tid: 歌单id,
            index: 将播放的歌曲在下面歌单中的位置,
            list: 歌单数组 //元素属性按照MusicListDisplay.js中的MusicListDisplay::state.musicList中的元素为标准
        }
        */
       if (this.currentTid !== event.tid){
            this.playlist = event.list
            this.currentTid = event.tid
       }
       this.currentPlayIndex = event.index
       this.PlayMusic(event.list[event.index])
    }

    setAudio(resourceURL, playedTime=0, play=true){
        this.audio.src = resourceURL
        this.audio.ontimeupdate =function(){
            let spentMinutes = Math.floor(this.audio.currentTime / 60)
            let spentSeconds = Math.floor(this.audio.currentTime % 60)
            spentMinutes = spentMinutes >9 ? spentMinutes: "0"+spentMinutes
            spentSeconds = spentSeconds >9 ? spentSeconds: "0"+spentSeconds

            let durationMinutes = Math.floor(this.audio.duration / 60)
            let durationSeconds = Math.floor(this.audio.duration % 60)
            durationMinutes = durationMinutes >9 ? durationMinutes: "0"+durationMinutes
            durationSeconds = durationSeconds >9 ? durationSeconds: "0"+durationSeconds

            this.setState({
                progress: (this.audio.currentTime / this.audio.duration) * 100,
                durationLabel: `${spentMinutes}:${spentSeconds} / ${durationMinutes}:${durationSeconds}`
            })
        }.bind(this)
        this.audio.onloadedmetadata = function(){
            this.audio.currentTime = playedTime
        }.bind(this)
        
        this.audio.volume = this.state.volume / 100
        if (play === true){
            this.audio.play()
            this.setState({ playBtnIcon: <PauseCircleFilled style={{fontSize: 42}}/>})
        } 
    }

    PlayEndEvent(){
        if (this.currentPlayIndex === this.playlist.length -1){
            this.currentPlayIndex = 0
        }
        else{
            this.currentPlayIndex += 1
        }
        this.PlayMusic(this.playlist[this.currentPlayIndex])
    }

    PlayMusic(musicInfo, playedTime = 0, play = true) {
        console.log(musicInfo)
        //config.saveHistory(this.currentTid, this.playlist, this.currentPlayIndex, this.audio.currentTime)
        this.audioInfo = {
            song_cover_pmid: musicInfo.album_ptid,
            song_name: musicInfo.song_name,
            singer:musicInfo.singer,
            duration: null
        }

        let qualityName = "none"
        let qulityColor = "orange"
        let filename = musicInfo.file.media_fid
        qualityName = "HQ"
        qulityColor= "rgb(78, 140, 151)"
       

        this.setState({
            music_cover_url: `http://music.inkneko.com/music_base/dimension_tripper.jpg`,
            music_name: musicInfo.song_name,
            music_singer: musicInfo.singer
        })

        this.setState({
            qulity: qualityName,
            qulityColor: qulityColor
        })

        let resourceURL = `http://music.inkneko.com/music_base/${filename}.mp3`
        this.setAudio(resourceURL, playedTime, play)
        
    }

    /*
    PlayMusic(musicInfo, playedTime=0, play=true){
        config.saveHistory(this.currentTid, this.playlist, this.currentPlayIndex, this.audio.currentTime)
        this.audioInfo = {
            song_cover_pmid: musicInfo.album_ptid,
            song_name: musicInfo.song_name,
            singer:musicInfo.singer,
            duration: null
        }

        let qualityName = "none"
        let qulityColor = "orange"
        let filename = musicInfo.file.media_fid
        if (musicInfo.file.size_flac > 0){
            qualityName = "SQ"
            qulityColor = "rgb(243, 82, 53)"
            filename = `F00${filename}.flac`
        }
        else if (musicInfo.file.size_320mp3 > 0){
            qualityName = "HQ"
            qulityColor= "rgb(78, 140, 151)"
            filename = `M800${filename}.mp3`
        }
        else if (musicInfo.file.size_128mp3 > 0){
            qualityName = "128kpbs"
            qulityColor = "black"
            filename = `M500${filename}.mp3`
        }
        else{
            alert("无音乐文件信息")
            this.audio.src = ""
            return
        }

        this.setState({
            music_cover_url: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${musicInfo.album_pmid}.jpg`,
            music_name: musicInfo.song_name,
            music_singer: musicInfo.singer
        })

        if (fs.existsSync(`${config.downloadRootPath}/${filename}`)===true){
            let extension = ""
            if (qualityName === "SQ"){
                extension = "flac"
            }
            else{
                extension = "mp3"
            }
            let resourceURL = this.audio.src = `data:audio/${extension};base64,${fs.readFileSync(`${config.downloadRootPath}/${filename}`, "base64")}`

            this.setState({
                qulity: qualityName,
                qulityColor: qulityColor
            })
            this.setAudio(resourceURL, playedTime, play)
            return
        }
        else if (config.cookie === ""){ //登录失效的简易判断
            qualityName = "128kpbs"
            qulityColor = "black"
            filename = `M500${musicInfo.file.media_fid}.mp3`
        }

        this.setState({
            qulity: qualityName,
            qulityColor: qulityColor
        })

        let data =`{"queryvkey":{"module":"vkey.GetVkeyServer","method":"CgiGetVkey","param":{"guid":"8397041246","songmid":["${musicInfo.mid}"],"songtype":[1],"filename" : [ "${filename}" ],"uin":"${config.login_uin}","loginflag":1,"platform":"20"}},"comm":{"uin":${config.login_uin},"format":"json","ct":19,"cv":1733}}`
        let option = {
            hostname: "inkneko.com",
            port: 8080,
            path: `/cgi-bin/load.py?-=${encodeURIComponent(data)}`
        }
        https.request(option, function(event){
            let response = ""
            event.on("data", function(chunk){
                response += chunk
            })
            event.on("end", function(){
                console.log(response)
                let signature = response
                let path = `/cgi-bin/musics.fcg?sign=${signature}&loginUin=${config.login_uin}&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0&data=${data}`
                let option = {
                    hostname: "u.y.qq.com",
                    port: 80,
                    path: encodeURI(path),
                    headers : {
                        "User-Agent": config.ua,
                        "Cookie": config.cookie
                    }
                }

                http.request(option, function(res){
                    let str = ""
                    res.on("data", function(chunk){
                        str += chunk
                    })

                    res.on("end", function(){
                        let serviceResponse = JSON.parse(str)
                        let resourceURL = `http://ws.stream.qqmusic.qq.com/${serviceResponse["queryvkey"]["data"]["midurlinfo"][0]["purl"]}`
                        if (serviceResponse["queryvkey"]["data"]["midurlinfo"][0]["purl"] === ""){
                            this.setState({
                                qulity: "登录失效"
                            })
                            this.audio.src = ""
                            return
                        }
                        this.setAudio(resourceURL, playedTime, play)
                    }.bind(this))
                }.bind(this)).end()
            }.bind(this))
        }.bind(this)).end()
    }*/

    OnSliderChange(event, newValue){
        if (this.audio.src===""){
            return
        }
        this.setState({progress: newValue})
        this.audio.currentTime = this.audio.duration * (newValue/100)
        if (this.audio.paused === true){
            this.OnPauseEvent()
        }
    }

    OnVolumeSliderChange(event, newValue){
        this.setState({volume: newValue})
        this.audio.volume = newValue / 100
    }

}

export default MusicPlayer