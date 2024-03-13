import { Box, Typography } from '@mui/material'
import FlightIcon from '@mui/icons-material/Flight'
import { AutovConfig } from './Config'

function AvInfo({ config }: { config: AutovConfig }) {
    return (
        <Box display="flex" alignItems="center" justifyContent="center" p={3}>
            <FlightIcon /> <Typography>{config.avName}</Typography>
        </Box>
    )
}

export default AvInfo
