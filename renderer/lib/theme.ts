import { createTheme, Theme } from '@mui/material/styles';
import { red, grey, green } from '@mui/material/colors';

export const lightMode = createTheme({
    palette: {
        primary: {
            main: '#556cd6',
            contrastText: "#fff"
        },
        secondary: {
            main: '#19857b',
        },
        text: {
            primary: "#000",
        },
        error: {
            main: red.A400,
        },
        success:{
            main: green.A200,
        },
        background: {
            default: '#fff',
        },
        pannelBackground: {
            main: "#fafafa",
            light: "#fffefe"
        },
        blueButton: {
            main: "#2196f3",
            contrastText: "#ffffff"
        },
        pannelButton: {
            main: "#2196f3",
            contrastText: "#ffffff"
        },
    },
    components: {
        MuiTextField: {
            styleOverrides: {
                root: ({ ownerState }) => ({
                    ...(ownerState.size === 'small' && {
                        "input": {
                            padding: "6px 12px"
                        }
                    })
                })
            }
        }
    }
    // MuiTableRow:{
    //     styleOverrides:{
    //         head:{
    //             backgroundColor: "#7e7e7e",
    //             color:"white"
    //         },
    //     }
    // },
    // MuiTableCell:{
    //     styleOverrides:{
    //         head:{
    //             color:"white"
    //         },
    //     }
    // }
});

export const darkMode = createTheme({
    palette: {
        mode: "dark",
        
        pannelBackground: {
            main: "#2A2A2A",
            light: "#1E1E1E",
        },
        success:{
            main: green.A200,
        },
        blueButton: {
            main: "#2196f3",
            contrastText: "#ffffff"
        },
        pannelButton: {
            main: "#2196f3",
            contrastText: "#ffffff"
        },
    }
})

export const darkModeNeptune = createTheme({
    palette: {
        primary: {
            main: '#52b3ff',
            contrastText: "#fff"
        },
        secondary: {
            main: '#19857b',
        },
        error: {
            main: red.A400,
        },
        success:{
            main: "#4eb353",
            contrastText: "#fff",
        },
        text: {
            primary: "#fff",
            secondary: "#fff"
        },
        background: {
            default: 'rgba(0,0,0,0)',
            paper: "#2c2c2c"
        },
        pannelBackground: {
            main: "rgba(255,255,255,0.1)",
            light: "rgba(255,255,255,0.05)",
        },
        blueButton: {
            main: "#2196f3",
            contrastText: "#ffffff"
        },
        pannelButton: {
            main: "#2196f3",
            contrastText: "#ffffff"
        },
    }
});

/** 暖阳：暖橙磨砂浅色，背景图为暖橙奶油色调（黑猫与零食） */
export const lightModeWarm = createTheme({
    palette: {
        primary: {
            main: '#ef8a3c',
            contrastText: "#fff"
        },
        secondary: {
            main: '#c77b3f',
        },
        text: {
            primary: "#3d2e22",
            secondary: "#7a6a5c"
        },
        error: {
            main: red.A400,
        },
        success: {
            main: green.A200,
        },
        background: {
            default: 'rgba(0,0,0,0)',
            paper: "rgba(255,251,240,0.92)"
        },
        pannelBackground: {
            main: "rgba(255,248,236,0.88)",
            light: "rgba(255,251,244,0.8)",
        },
        blueButton: {
            main: "#ef8a3c",
            contrastText: "#ffffff"
        },
        pannelButton: {
            main: "#ef8a3c",
            contrastText: "#ffffff"
        },
    }
});

/** 森屿：青绿磨砂浅色，背景图为沙滩丛林（明亮青绿调） */
export const lightModeIsland = createTheme({
    palette: {
        primary: {
            main: '#2b9d84',
            contrastText: "#fff"
        },
        secondary: {
            main: '#3aa6a0',
        },
        text: {
            primary: "#1e3830",
            secondary: "#5c7a70"
        },
        error: {
            main: red.A400,
        },
        success: {
            main: green.A200,
        },
        background: {
            default: 'rgba(0,0,0,0)',
            paper: "rgba(240,250,246,0.92)"
        },
        pannelBackground: {
            main: "rgba(238,249,244,0.88)",
            light: "rgba(245,252,248,0.8)",
        },
        blueButton: {
            main: "#2b9d84",
            contrastText: "#ffffff"
        },
        pannelButton: {
            main: "#2b9d84",
            contrastText: "#ffffff"
        },
    }
});

/** 月夜：藏青磨砂深色，背景图为夜色城堡与淡金圆月（同海王星的透明面板模式） */
export const darkModeMoon = createTheme({
    palette: {
        primary: {
            main: '#e8c56d',
            contrastText: "#26202a"
        },
        secondary: {
            main: '#8ba7d4',
        },
        error: {
            main: red.A400,
        },
        success: {
            main: "#4eb353",
            contrastText: "#fff",
        },
        text: {
            primary: "#eef1f8",
            secondary: "#b9c2d6"
        },
        background: {
            default: 'rgba(0,0,0,0)',
            paper: "#1d2436"
        },
        pannelBackground: {
            main: "rgba(19,26,44,0.85)",
            light: "rgba(24,32,52,0.78)",
        },
        blueButton: {
            main: "#e8c56d",
            contrastText: "#26202a"
        },
        pannelButton: {
            main: "#e8c56d",
            contrastText: "#26202a"
        },
    }
});

/** 纯黑：真黑面板的 OLED 深色（区别于深色的灰黑面板） */
export const darkModeBlack = createTheme({
    palette: {
        mode: "dark",
        background: {
            paper: "#0d0d0d"
        },
        pannelBackground: {
            main: "#000000",
            light: "#0a0a0a",
        },
        success: {
            main: green.A200,
        },
        blueButton: {
            main: "#2196f3",
            contrastText: "#ffffff"
        },
        pannelButton: {
            main: "#2196f3",
            contrastText: "#ffffff"
        },
    }
});


declare module '@mui/material/styles' {
    interface Palette {
        blueButton: Palette['primary'];
        pannelButton: Palette['primary'];
        pannelBackground: Palette['primary'];

    }

    interface PaletteOptions {
        blueButton: PaletteOptions['primary'];
        pannelButton: PaletteOptions['primary'];
        pannelBackground: PaletteOptions['primary'];
    }
}

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        blueButton: true;
        pannelButton: true;
    }
}

/** 主题预设条目：name 与 preset 的 key 一致（持久化与选中态判定均以 key 为准） */
export interface IThemePresetEntry {
    theme: Theme,
    name: string,
    /** UI 显示名（中文） */
    label: string,
    backgroundUrl: string
}

/**
 * 主题预设（对象顺序即设置页展示顺序：浅色组在前、深色组在后）。
 * 注意：带 backgroundUrl 的预设，pannelBackground 必须为 rgba 半透明色，
 * 否则不透明面板铺满整窗、背景图不可见（暖阳曾因复用浅色不透明面板而与浅色无异）
 */
export const preset: Record<string, IThemePresetEntry> = {
    light:{
        theme: lightMode,
        name: "light",
        label: "浅色",
        backgroundUrl: ""
    },
    lightOrange:{
        theme: lightModeWarm,
        name: "lightOrange",
        label: "暖阳",
        backgroundUrl: "/images/lxh-background01.jpg"
    },
    lightIsland:{
        theme: lightModeIsland,
        name: "lightIsland",
        label: "森屿",
        backgroundUrl: "/images/lxh-background03.jpg"
    },
    dark:{
        theme: darkMode,
        name: "dark",
        label: "深色",
        backgroundUrl:""
    },
    darkAmoled:{
        theme: darkModeBlack,
        name: "darkAmoled",
        label: "纯黑",
        backgroundUrl: ""
    },
    customizedDarkMode: {
        theme: darkModeNeptune,
        name: "customizedDarkMode",
        label: "海王星",
        backgroundUrl:"/images/nep-2730x1536.png"
    },
    darkMoon: {
        theme: darkModeMoon,
        name: "darkMoon",
        label: "月夜",
        backgroundUrl: "/images/lxh-background02.jpg"
    }
}