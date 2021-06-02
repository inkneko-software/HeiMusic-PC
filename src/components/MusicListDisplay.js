import React from "react"

import Avatar from "@material-ui/core/Avatar"
import Button from "@material-ui/core/Button"

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';

import MusicNote from "@material-ui/icons/MusicNote"

import "./css/MusicListDisplay.css"
const remote = window.require("electron").remote

const config = remote.require("./heiMusicConfig")

class MusicListDisplay extends React.Component{
    constructor(props){
        super(props)
        this.tid = props.tid
        this.loginUser = 'qq' //props.loginUser
        if (this.loginUser === undefined)
        {
            this.loginUser = 0
        }

        this.headers = [
            {id:"name", label: "歌曲", width: "40%"},
            {id:"singer", label: "歌手", width: "30%"},
            {id:"album", label: "专辑", width: "30%"}
        ];

        this.state = 
        {
            albumInfo:
            {
                tid: null,
                name: "加载中",
                ptid: null,
                pic: null,
                listen_num: "---",
                create_time: null,
                cur_song_num: null,
                total_song_num: null
            },
            musicList:
            [
                /*{
                    mid: null,
                    song_name: null,
                    singer: null,
                    album_name: null,
                    album_ptid: null,
                    file:{
                        media_fid: null,
                        size_128mp3: null,
                        size_320mp3: null,
                        size_flac: null
                    }
                }, ...*/
            ]
        }

    }

    render(){
        if (this.tid === null){
            return (
                <div className="empty-page">
                    <div className="empty-page-text">
                        墨猫音乐客户端
                    </div>
                </div>
            )
        }
        else{
            return (
                <div className="music-list-display">
                    <div className="diss-info">
                        <Avatar  className="album-cover" variant="square" src={this.state.albumInfo.pic}><MusicNote style={{fontSize: 72}}/></Avatar>
                        <div className="album-brief">
                            <div className="album-brief-name">{this.state.albumInfo.name}</div>
                            <div className="album-brief-listen-num">{"播放量 " + this.state.albumInfo.listen_num}</div>
                            <div className="ablum-brief-tool-bar">
                                <Button className="album-brief-tool-bar-btn album-brief-tool-bar-play" onClick={this.state.musicList.length > 0? this.PostPlayEvent.bind(this, 0) : ()=>{}}>播放全部</Button>
                                <Button className="album-brief-tool-bar-btn">下载</Button>
                            </div>
                        </div>
                    </div>
                    <div className="song-list">
                        <TableContainer className="song-list-table-container">
                            <Table stickyHeader aria-label="sticky table" className="song-list-table">
                                <TableHead>
                                    <TableRow>
                                        {this.headers.map((header) => (
                                            <TableCell
                                            key={header.id}
                                            align={header.align}
                                            style={{ maxWidth: header.width}}
                                            >
                                            {header.label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody className="song-list-table-body">
                                    {this.state.musicList.map((row, index) => {
                                        return (
                                            <TableRow hover role="checkbox" tabIndex={-1} key={row.mid} onDoubleClick={this.PostPlayEvent.bind(this, index)}>
                                                    <TableCell style={{maxWidth: "40%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} key={1} align={"left"} title={row.song_name}><a onClick={this.PostPlayEvent.bind(this, index)} className="music-list-songname-clickable">{row.song_name}</a></TableCell>
                                                    <TableCell style={{maxWidth: "30%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} key={2} align={"left"} title={row.singer}>{row.singer}</TableCell>
                                                    <TableCell style={{maxWidth: "30%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} key={3} align={"left"} title={row.album_name}>{row.album_name}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </div>
            )
        }
    }
    
    componentDidMount(){
        var https = window.require("http")
        if (this.tid === null)
        {
            return
        }

        var options ={
            host: 'music.inkneko.com',
            port: 80,
            method: "GET",
            headers:{
                "User-Agent": config.client_ua
            },
            path: `/api/v1/getCollection?id=${this.tid}&loginUin=${this.loginUser}`
        }
        let callback = function(response)
        {
            let str =""
            response.on('data', function(chunk){
                str += chunk
            })

            response.on('end', function()
            {
                let json = JSON.parse(str)
                console.log(json)
                let dissinfo = json
                let album_pic = `http://music.inkneko.com/${json.cover_url}`
                if (dissinfo.dissname==="我喜欢"){
                    album_pic = "https://y.gtimg.cn/mediastyle/global/img/cover_like.png"
                }
                //cd info
                this.setState({
                    albumInfo:{
                        tid: json.collection_id,
                        name: json.name,
                        pic:  album_pic,
                        listen_num: 0,
                        create_time: 0,
                        cur_song_num: 1,
                        total_song_num: json.music_nums
                    }
                })

                //song list
                let musicList = []
                for (let i = 0; i < dissinfo.list.length; ++i){
                    let singer = [];/*
                    for (let singerIndex=0; singerIndex<dissinfo.songlist[i].singer.length; ++singerIndex)
                    {
                        singer.push(dissinfo.songlist[i].singer[singerIndex].title)
                    }*/
                    singer.push("nao")
                    let musicInfo = {
                        mid: dissinfo.list[i].music_id,
                        song_name: dissinfo.list[i].music_name,
                        singer: singer.join("/"),
                        album_name: dissinfo.list[i].album_name,
                        album_pmid: null,
                        file:{
                            media_fid: dissinfo.list[i].media_list.media_id,
                            size_128mp3: dissinfo.list[i].media_list.mp3_320k,
                            size_320mp3: dissinfo.list[i].media_list.mp3_128k,
                            size_flac: dissinfo.list[i].media_list.media_flac
                        }
                    }
                    console.log(dissinfo.list[i].media_list.media_id)

                    musicList.push(musicInfo)
                }

                this.setState({
                    musicList: musicList
                })
            }.bind(this))
        }.bind(this)

        https.request(options, callback).end();
    }

    PostPlayEvent(index){
        let event = new Event("MusicPlayerListener")
        event.tid = this.tid
        event.index = index
        event.list = this.state.musicList
        window.dispatchEvent(event)
    }

}

export default MusicListDisplay