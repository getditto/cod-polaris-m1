// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// ^ we only have this sledgehammer: https://github.com/Microsoft/TypeScript/issues/19573

import {
    Box,
    Button,
    ButtonGroup,
    FormControlLabel,
    FormGroup,
    Switch,
} from '@mui/material'

function ArmSwtich({
    armed,
    onArm,
    enabled,
}: {
    armed: boolean
    onArm: (armed: boolean) => void
    enabled: boolean
}) {
    console.debug(`Creating arm switch w/ enabled=${enabled}`)
    return (
        <Switch
            checked={armed}
            onChange={(e, checked) => onArm(checked)}
            disabled={!enabled}
            inputProps={{ 'aria-label': 'controlled' }}
        />
    )
}

type poke = () => Promise<void>
function AutovControls({
    onGetTrialStatus,
    onReset,
    onClear,
    onArm,
    armed,
    armEnabled,
}: {
    onGetTrialStatus: poke
    onReset: poke
    onClear: poke
    onArm: (armed: boolean) => void
    armed: boolean
    armEnabled: boolean
}) {
    const armSwitch = ArmSwtich({
        armed: armed,
        onArm: onArm,
        enabled: armEnabled,
    })
    // For now, a button group with dummy buttons
    return (
        <Box p={1} sx={{ display: 'flex', justifyContent: 'center' }}>
            <ButtonGroup>
                <FormGroup>
                    <FormControlLabel control={armSwitch} label="Arm" />
                </FormGroup>
                <Button onClick={onGetTrialStatus}>Get Trial Status</Button>
                <Button onClick={onReset}>Reset Client</Button>
                <Button onClick={onClear}>Clear Log</Button>
            </ButtonGroup>
        </Box>
    )
}

export default AutovControls
