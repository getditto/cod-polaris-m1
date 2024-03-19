import { Box, Typography } from '@mui/material'
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat'
import { UiConfig } from '../common/UiConfig'

function BaseInfo({ config }: { config: UiConfig }) {
    return (
        <Box display="flex" alignItems="center" justifyContent="center" p={3}>
            <DirectionsBoatIcon /> <Typography>{config.baseName}</Typography>
        </Box>
    )
}

export default BaseInfo
