import React from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { BoxProps, ListItemButtonProps, ListProps, Stack } from "@mui/material"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import ListItemText from "@mui/material/ListItemText"
import ListItemIcon from "@mui/material/ListItemIcon"
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import HeadphonesOutlinedIcon from '@mui/icons-material/HeadphonesOutlined';
import { theme } from "../../lib/theme"
import { styled } from "@mui/material/styles"

import { PannelListContext } from "./PannelList"
import { RadioPannelListContext } from "./RadioPannelList"
import Link from "next/link"

export const StyledListItemButton = styled(ListItemButton)<ListItemButtonProps>({
    borderRadius: "6px",
    paddingTop: "0px",
    paddingBottom: "0px",
    marginBottom: "12px",
    ":hover": {
        backgroundColor: "#f5f5f5",
        color: "#000000",
    },
    "&.Mui-selected": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        "& .MuiListItemIcon-root": {
            color: "#ffffff",
        },
        ":hover": {
            backgroundColor: "#3e59d7",
            color: "#ffffff",
        }
    },
})


interface IPannelItem extends ListItemButtonProps {
    index: number,
    text: string,
    icon?: React.ReactNode,
    href: string,
}

function PannelItem(props: IPannelItem) {
    return (
        <PannelListContext.Consumer>
            {
                pannelItemCtx => {
                    return (
                        <RadioPannelListContext.Consumer>
                            {
                                radioPannelListCtx => {
                                    const itemClickedHandler = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                                        radioPannelListCtx.setActiveIndex(props.index);
                                        radioPannelListCtx.setActiveName(pannelItemCtx.name);
                                        if (typeof (props.onClick) !== "undefined") {
                                            props.onClick(event);
                                        }
                                    }
                                    return (
                                        <Link href={props.href}  passHref>
                                            <StyledListItemButton
                                                selected={props.index === radioPannelListCtx.activeIndex && pannelItemCtx.name === radioPannelListCtx.activeName}
                                                onClick={itemClickedHandler}
                                                {...props}
                                            >
                                                {
                                                    typeof (props.icon) !== "undefined" ? props.icon : null
                                                }
                                                <ListItemText sx={[typeof (props.icon) !== "undefined" && { marginLeft: "8px" }]} >
                                                    <Typography noWrap={true} variant="subtitle2">
                                                        {props.text}
                                                    </Typography>
                                                </ListItemText>

                                            </StyledListItemButton>
                                        </Link>
                                    )
                                }
                            }
                        </RadioPannelListContext.Consumer>

                    )
                }
            }
        </PannelListContext.Consumer>
    )
}

export default PannelItem;