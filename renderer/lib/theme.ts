import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#556cd6',
            contrastText: "#fff"
        },
        secondary: {
            main: '#19857b',
        },
        text:{
            primary: "#000",
        },
        error: {
            main: red.A400,
        },
        background: {
            default: '#fff',
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

export const customizedDarkMode = createTheme({
    palette: {
        primary: {
            main: '#556cd6',
            contrastText: "#fff"
        },
        secondary: {
            main: '#19857b',
        },
        error: {
            main: red.A400,
        },
        text:{
            primary: "#fff",
            secondary: "#fff"
        },
        background: {
            default: 'black',
            paper: "black"
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


    }

    interface PaletteOptions {
        blueButton: PaletteOptions['primary'];
        pannelButton: PaletteOptions['primary'];


    }
}

declare module '@mui/material/Button' {
    interface ButtonPropsColorOverrides {
        blueButton: true;
        pannelButton: true;
    }
}