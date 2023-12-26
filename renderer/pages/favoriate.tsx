import { useEffect, useState } from "react"
import SongList from "./songlist/[id]"
import { MusicVo, PlaylistControllerService } from "@api/codegen"

export default function Favoriate() {
    return <SongList isUserFavoriteMusicList />
}