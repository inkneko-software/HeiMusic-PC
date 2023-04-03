import React from 'react';
import InputBase from '@mui/material/InputBase';

import { InputBaseProps } from '@mui/material/InputBase';
import { useTheme } from '@mui/material';

export interface IInput extends InputBaseProps {

}

export default function Input(props: IInput) {
    const theme = useTheme();
    return (
        <InputBase {...props} sx={{
            borderRadius: '4px',
            border: '2px solid',
            padding: '2px 12px',
            fontSize: '14px',
            ":hover": {
                border: '2px solid',
                borderColor: theme.palette.primary.main,
            },
            ":focus-within": {
                border: '2px solid',
                borderColor: theme.palette.primary.main,
            },
            "input": {
                padding: 0
            },
            ...props.sx
        }}/>
    )
}