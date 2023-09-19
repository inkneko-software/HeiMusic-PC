import React from "react"
import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import { ThemeProviderProps } from '@mui/styles';
import {theme, darkModeNeptune, darkMode} from './theme'
interface IHeiMusicThemeContext {
    mode: string,
    backgroundUrl: string,
    setMode: (mode: string) => void
}

export const HeiMusicThemeContext = React.createContext<IHeiMusicThemeContext>({ mode: "light", backgroundUrl: "/images/intro_bg01.jpg", setMode: () => { } })

interface IHeiMusicThemeProvider {
    children?: React.ReactNode;
}

interface IHeiMusicTheme{
    theme: Theme,
    name: string,
    backgroundUrl: string
}

function HeiMusicThemeProvider(props: IHeiMusicThemeProvider) {
    const [appTheme, setAppTheme] = React.useState<IHeiMusicTheme>({
        theme: theme,
        name: "light",
        backgroundUrl: ""
    })

    const appThemeTranslator = (mode: string)=>{
        const preset = {
            light:{
                theme: theme,
                name: "light",
                backgroundUrl: ""
            },
            dark:{
                theme: darkMode,
                name: "darkMode",
                backgroundUrl:""
            },
            customizedDarkMode: {
                theme: darkModeNeptune,
                name: "darkModeNeptune",
                backgroundUrl:"/images/nep-2730x1536.png"
            },
            lightOrange:{
                theme: theme,
                name: "lightOrange",
                backgroundUrl: "/images/lxh-background01.jpg"
            }
        }
        if (typeof (preset[mode]) === "undefined"){
            setAppTheme(preset.light)
            return;
        }
        setAppTheme(preset[mode])
    }

    return (
            <ThemeProvider theme={appTheme.theme} {...props}>
                <HeiMusicThemeContext.Provider value={{mode:appTheme.name, backgroundUrl: appTheme.backgroundUrl, setMode: appThemeTranslator}}>
                    {props.children}
                </HeiMusicThemeContext.Provider>
            </ThemeProvider>

    )
}

export default HeiMusicThemeProvider;