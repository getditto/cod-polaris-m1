import { Box, Button, ButtonGroup } from '@mui/material'

type poke = () => Promise<void>
function AutovControls({
    onGetTrialStatus,
    onReset,
    onClear,
}: {
    onGetTrialStatus: poke
    onReset: poke
    onClear: poke
}) {
    // For now, a button group with dummy buttons
    return (
        <Box p={1} sx={{ display: 'flex', justifyContent: 'center' }}>
            <ButtonGroup>
                <Button onClick={onGetTrialStatus}>Get Trial Status</Button>
                <Button onClick={onReset}>Reset Client</Button>
                <Button onClick={onClear}>Clear Log</Button>
            </ButtonGroup>
        </Box>
    )
}

export default AutovControls
