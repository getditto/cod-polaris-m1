import { Box, Typography } from '@mui/material'
import FlightIcon from '@mui/icons-material/Flight'
import { UiConfig } from '../common/UiConfig'

function AvInfo({ config }: { config: UiConfig }) {
    return (
        <Box display="flex" alignItems="center" justifyContent="center" p={3}>
            <FlightIcon /> <Typography>{config.avName}</Typography>
        </Box>
    )
}

export default AvInfo
