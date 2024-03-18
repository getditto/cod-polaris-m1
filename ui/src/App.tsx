//import { useState } from 'react'
import './App.css'
import { Box, Grid, ThemeProvider, createTheme } from '@mui/material'
import BaseUi from './base/BaseUi'
import AutovUi from './autov/AutovUi'

const dark = createTheme({ palette: { mode: 'dark' } })

function App() {
    //  const [count, setCount] = useState(0)

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
                        <AutovUi />
                    </Grid>
                    <Grid item xs={12} lg={6}>
                        <BaseUi />
                    </Grid>
                </Grid>
            </Box>
        </ThemeProvider>
    )
}

export default App
