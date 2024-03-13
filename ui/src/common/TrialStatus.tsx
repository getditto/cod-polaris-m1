import { Box, Typography } from '@mui/material'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import StopIcon from '@mui/icons-material/Stop'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { TrialState } from './types'

function StateIcon({ status }: { status: TrialState }) {
    switch (status) {
        case TrialState.Start:
            return <PlayArrowIcon />
        case TrialState.End:
            return <StopIcon />
        case TrialState.Wait:
            return <HourglassBottomIcon />
    }
}

function TrialStatus({ status }: { status: TrialState }) {
    // Create a filled box with:
    // background Color: Blue for wait, Green for Start, and Red for End
    // Material UI Icon: HourglassBottom for Wait, PlayArrow for Start, and Stop for End
    // Text (typography) of the enum value
    return (
        <Box
            bgcolor={
                status === TrialState.Wait
                    ? 'blue'
                    : status === TrialState.Start
                      ? 'green'
                      : 'red'
            }
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={3}
        >
            <StateIcon status={status} /> <Typography>{status}</Typography>
        </Box>
    )
}

export default TrialStatus
