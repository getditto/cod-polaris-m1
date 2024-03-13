import { Box } from '@mui/material'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ErrorIcon from '@mui/icons-material/Error'

function Icon({ success }: { success: boolean }) {
    if (success) {
        return <ThumbUpIcon color="success" />
    } else {
        return <ErrorIcon color="error" />
    }
}

// Simple red / green thumbs up or warning icon
function Success({ success }: { success: boolean }) {
    return (
        <Box
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Icon success={success} />
        </Box>
    )
}

export default Success
