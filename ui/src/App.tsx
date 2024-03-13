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
            <Box width="100%" height="100%" p={2} alignItems="flex-start">
                <Grid container alignItems="flex-start" spacing={2}>
                    <Grid item xs={6}>
                        <AutovUi />
                    </Grid>
                    <Grid item xs={6}>
                        <BaseUi />
                    </Grid>
                </Grid>
            </Box>
        </ThemeProvider>
    )
}

export default App
