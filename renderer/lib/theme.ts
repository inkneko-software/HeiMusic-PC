import { createTheme } from '@mui/material/styles';
import { red, grey } from '@mui/material/colors';

export const theme = createTheme({
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