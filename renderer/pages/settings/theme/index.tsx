import * as React from "react"
import { Box, Typography } from "@mui/material"
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'

import Layout from "./layout"
import { preset } from "../../../lib/theme"
import { HeiMusicThemeContext } from "../../../lib/HeiMusicThemeProvider"

/**
 * 主题设置页
 *
 * 展示 lib/theme.ts preset 中的全部主题预设，点选即时生效：
 * 预览配色取自各预设自身的 palette（而非当前主题），
 * 有 backgroundUrl 的预设以背景图铺底、面板色叠加其上
 */
export default function ThemeSettings() {
    const heimusicThemeContext = React.useContext(HeiMusicThemeContext)

    return (
        <Layout>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {Object.entries(preset).map(([key, p]) => {
                    const selected = heimusicThemeContext.mode === p.name
                    return (
                        <Box
                            key={key}
                            onClick={() => { heimusicThemeContext.setMode(key) }}
                            sx={{
                                width: '208px',
                                padding: '4px',
                                border: '2px solid',
                                borderColor: selected ? 'primary.main' : 'divider',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                ':hover': { borderColor: selected ? 'primary.main' : 'text.disabled' },
                            }}
                        >
                            {/* 主题预览：迷你主布局示意（侧栏 + 内容区 + 播放条） */}
                            <Box sx={{
                                height: '120px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                display: 'flex',
                                background: p.backgroundUrl !== "" ? `url(${p.backgroundUrl}) center center / cover no-repeat` : p.theme.palette.pannelBackground.light,
                            }}>
                                {/* 侧边栏示意 */}
                                <Box sx={{ width: '30%', height: '100%', background: p.theme.palette.pannelBackground.main, display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 6px', boxSizing: 'border-box' }}>
                                    <Box sx={{ width: '12px', height: '12px', borderRadius: '50%', background: p.theme.palette.primary.main }} />
                                    <Box sx={{ height: '6px', borderRadius: '3px', background: p.theme.palette.primary.main, opacity: 0.9, width: '80%' }} />
                                    <Box sx={{ height: '6px', borderRadius: '3px', background: p.theme.palette.text.primary, opacity: 0.3, width: '65%' }} />
                                    <Box sx={{ height: '6px', borderRadius: '3px', background: p.theme.palette.text.primary, opacity: 0.3, width: '72%' }} />
                                </Box>
                                {/* 内容区示意 */}
                                <Box sx={{ flexGrow: 1, background: p.theme.palette.pannelBackground.light, display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 6px', boxSizing: 'border-box' }}>
                                    <Box sx={{ height: '8px', borderRadius: '4px', background: p.theme.palette.text.primary, opacity: 0.25, width: '70%' }} />
                                    <Box sx={{ height: '8px', borderRadius: '4px', background: p.theme.palette.text.primary, opacity: 0.15, width: '90%' }} />
                                    {/* 播放控制条示意 */}
                                    <Box sx={{ marginTop: 'auto', height: '14px', borderRadius: '7px', background: p.theme.palette.primary.main, opacity: 0.9, width: '60%' }} />
                                </Box>
                            </Box>
                            {/* 名称与选中态 */}
                            <Box sx={{ display: 'flex', alignItems: 'center', padding: '6px 4px 2px' }}>
                                <Typography variant="body2">{p.label}</Typography>
                                {selected && <CheckCircleRoundedIcon sx={{ marginLeft: 'auto', color: 'primary.main' }} fontSize='small' />}
                            </Box>
                        </Box>
                    )
                })}
            </Box>
        </Layout>
    )
}
