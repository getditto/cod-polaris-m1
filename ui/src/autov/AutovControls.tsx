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
    Typography,
} from '@mui/material'
import Slider from '@mui/material/Slider';
import { Fragment } from 'react/jsx-runtime';

function ArmSwtich({
    armed,
    onArm,
    enabled,
}: {
    armed: boolean
    onArm: (armed: boolean) => void
    enabled: boolean
}) {
    return (
        <Switch
            checked={armed}
            onChange={(e, checked) => onArm(checked)}
            disabled={!enabled}
            inputProps={{ 'aria-label': 'controlled' }}
        />
    )
}


function valuetext(value: number) {
    return `${value}°C`;
}

function DiscreteSlider({ seconds, setSeconds }: { seconds: seconds, setSeconds: (number) => void }) {
    return (
        <Box sx={{ flexGrow: 1, mx: 2 }}>
            <Slider
                aria-label="Telemetry Rate"
                value={seconds}
                onChange={(_e, val) => setSeconds(val)}
                getAriaValueText={valuetext}
                valueLabelDisplay="auto"
                shiftStep={2}
                step={1}
                marks
                min={1}
                max={15}
            />
        </Box>
    );
}

type poke = () => Promise<void>
function AutovControls({
    onGetTrialStatus,
    onReset,
    onClear,
    onArm,
    armed,
    armEnabled,
    telemRate,
    setTelemRate,
}: {
    onGetTrialStatus: poke
    onReset: poke
    onClear: poke
    onArm: (armed: boolean) => void
    armed: boolean
    armEnabled: boolean
    telemRate: number,
    setTelemRate: (number) => void

}) {
    const armSwitch = ArmSwtich({
        armed: armed,
        onArm: onArm,
        enabled: armEnabled,
    })
    // For now, a button group with dummy buttons
    return (
        <Fragment>
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
            <Box p={1} sx={{ display: 'flex', justifyContent: 'center', p:2 }}>
                <Typography gutterBottom>
                Telemetry Rate:
                </Typography>
                <DiscreteSlider seconds={telemRate} setSeconds={setTelemRate} />
                <Typography id="telem-slider-val" gutterBottom>
                {telemRate.toFixed(1).toString()}
                </Typography>
            </Box>
        </Fragment>
    )
}

export default AutovControls
