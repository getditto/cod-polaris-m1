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

export default StateIcon
