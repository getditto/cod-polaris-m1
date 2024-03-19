import './App.css'
import { Box, Grid, ThemeProvider, createTheme } from '@mui/material'
import BaseUi from './base/BaseUi'
import AutovUi from './autov/AutovUi'
import { useRef } from 'react'
import { UiConfig } from './common/UiConfig'

const dark = createTheme({ palette: { mode: 'dark' } })

function App() {
    const uiConfig = useRef(new UiConfig())

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
                        <AutovUi config={uiConfig.current} />
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <BaseUi config={uiConfig.current} />
                    </Grid>
                </Grid>
            </Box>
        </ThemeProvider>
    )
}

export default App
