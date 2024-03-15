import React from 'react'
import Box, { BoxProps } from '@mui/material/Box'
import { useTheme } from '@mui/styles'

export interface ISpectrumIconProps extends BoxProps {
    variant: 'small' | 'medium' | 'large'
}


export default function SpectrumIcon(props: ISpectrumIconProps) {
    const theme = useTheme();

    const Slide = ({ duration }) => {
        return (
            <Box sx={{
                flex: '1 0 auto',
                height: '100%',
                backgroundColor: theme.palette.primary.main,
                margin: '0px 1px',
                animation: `0.5s linear ${duration}s infinite normal wave_slide`
            }} />
        )
    }
    const size = {
        'small': {
            width: '14px',
            height: '14px',
        },
        'medium': {
            width: '20px',
            height: '20px',
        },
        'large': {
            width: '32px',
            height: '32px',
        }
    }
    return (
        <Box {...props}
            sx={{
                ...size[props.variant],
                flexDirection: 'row-reverse',
                transform: 'rotate(0.5turn)',
                padding: '1px 1px',
                display: 'flex',
                overflow: 'hidden',
                '@keyframes wave_slide': {
                    '0%': {
                        height: '100%'
                    },
                    '50%': {
                        height: '20%'
                    },
                    '100%': {
                        height: '100%'
                    }
                }
            }}>
            <Slide duration={0} />
            <Slide duration={0.1} />
            <Slide duration={0.2} />
        </Box >
    )
}