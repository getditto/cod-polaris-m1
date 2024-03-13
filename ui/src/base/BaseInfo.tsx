import { Box, Typography } from '@mui/material'
import { BaseConfig } from './BaseConfig'
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat'

function BaseInfo({ config }: { config: BaseConfig }) {
    return (
        <Box display="flex" alignItems="center" justifyContent="center" p={3}>
            <DirectionsBoatIcon /> <Typography>{config.baseName}</Typography>
        </Box>
    )
}

export default BaseInfo
