import './App.css'
import { Box, Grid, ThemeProvider, createTheme } from '@mui/material'
import BaseUi from './base/BaseUi'
import AutovUi from './autov/AutovUi'
import { useRef } from 'react'
import { AutovConfig } from './autov/Config'
import { BaseConfig } from './base/BaseConfig'

const dark = createTheme({ palette: { mode: 'dark' } })

function App() {
    const autovConfig = useRef(new AutovConfig())
    const baseConfig = useRef(new BaseConfig())

    return (
        <ThemeProvider theme={dark}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirections: { md: 'column', lg: 'row' },
                }}
            >
                <Grid container sx={{ height: '100vh' }}>
                    <Grid item xs={12} lg={6}>
                        <AutovUi config={autovConfig.current} />
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <BaseUi config={baseConfig.current} />
                    </Grid>
                </Grid>
            </Box>
        </ThemeProvider>
    )
}

export default App
