import { Box, Typography } from '@mui/material'
import { AvStatus } from './TrialLifecycle'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed'

function Location({ avStatus }: { avStatus: AvStatus }) {
    if (!avStatus.lat || !avStatus.lon) {
        return <GpsNotFixedIcon />
    } else {
        return (
            <Box>
                <GpsFixedIcon />
                <Typography sx={{ fontSize: 10 }}>
                    {' '}
                    {avStatus.lat} {avStatus.lon}{' '}
                </Typography>
            </Box>
        )
    }
}

function AvState({ avStatus }: { avStatus: AvStatus }) {
    return (
        <Box>
            <Location avStatus={avStatus} />
            <Typography sx={{ fontSize: 10 }}>
                {avStatus.heading} {avStatus.behavior} {avStatus.missionPhase}
            </Typography>
        </Box>
    )
}

export default AvState
