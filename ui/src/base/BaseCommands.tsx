import { Box, Button, ButtonGroup, MenuItem, TextField } from '@mui/material'

type poke = () => Promise<void>
type change = (event: React.ChangeEvent<{ value: unknown }>) => void

function BaseCommands({
    onStart,
    onEnd,
    onClear,
    onIdChange,
    trialId,
    trialIds,
}: {
    onStart: poke
    onEnd: poke
    onClear: poke
    onIdChange: change
    trialId: string
    trialIds: string[]
}) {
    return (
        // Start and End buttons with a text field to enter a trial id string
        <Box p={1} sx={{ display: 'flex', justifyContent: 'center' }}>
            <TextField
                id="trialid-select"
                select
                label="Select Trial ID"
                value={trialId}
                onChange={onIdChange}
            >
                {trialIds.map((id) => (
                    <MenuItem key={id} value={id}>
                        {id}
                    </MenuItem>
                ))}
            </TextField>
            <ButtonGroup>
                <Button onClick={onStart}>Trial Start</Button>
                <Button onClick={onEnd}>Trial End</Button>
                <Button onClick={onClear}>Clear Log</Button>
            </ButtonGroup>
        </Box>
    )
}

export default BaseCommands
