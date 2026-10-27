import React from "react"
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import { ThemeProviderProps } from '@mui/styles';
import { preset, lightMode, darkModeNeptune, darkMode } from './theme'
interface IHeiMusicThemeContext {
    mode: string,
    backgroundUrl: string,
    setMode: (mode: string) => void
}

export const HeiMusicThemeContext = React.createContext<IHeiMusicThemeContext>({ mode: "light", backgroundUrl: "/images/intro_bg01.jpg", setMode: () => { } })

interface IHeiMusicThemeProvider {
    children?: React.ReactNode;
}

interface IHeiMusicTheme {
    theme: Theme,
    name: string,
    backgroundUrl: string
}

/** 非 Electron 端（网页/安卓）主题持久化键，沿用 heimusic.* 命名惯例 */
const THEME_STORAGE_KEY = 'heimusic.theme';

function HeiMusicThemeProvider(props: IHeiMusicThemeProvider) {
    const [appTheme, setAppTheme] = React.useState<IHeiMusicTheme>({
        theme: lightMode,
        name: "light",
        backgroundUrl: ""
    })

    React.useEffect(() => {
        if (typeof (window) === "undefined") return;
        if (typeof (window.electronAPI) !== 'undefined') {
            //Electron：读取配置中的主题设定，并显示主窗口
            (async () => {
                var config = await window.electronAPI.config.get();
                setAppTheme(preset[config.theme] ?? preset.light)
                window.electronAPI.windowManagement.show();
            })()
        } else {
            //网页/安卓：主题持久化在 localStorage
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            setAppTheme(preset[stored] ?? preset.light)
        }
    }, [])

    const appThemeTranslator = (mode: string) => {
        if (typeof (preset[mode]) === "undefined") {
            setAppTheme(preset.light)
            return;
        }
        setAppTheme(preset[mode])
        //若当前为electron环境，则保存配置
        if (typeof (window) !== "undefined" && typeof (window.electronAPI) !== 'undefined') {
            window.electronAPI.config.set("theme", mode);
            window.electronAPI.config.save();
        } else if (typeof (window) !== "undefined") {
            //网页/安卓：写入 localStorage
            localStorage.setItem(THEME_STORAGE_KEY, mode);
        }
    }

    return (
        <ThemeProvider theme={appTheme.theme} {...props}>
            <HeiMusicThemeContext.Provider value={{ mode: appTheme.name, backgroundUrl: appTheme.backgroundUrl, setMode: appThemeTranslator }}>
                {props.children}
            </HeiMusicThemeContext.Provider>
        </ThemeProvider>

    )
}

export default HeiMusicThemeProvider;