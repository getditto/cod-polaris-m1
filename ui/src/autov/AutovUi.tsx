import { Box, Grid } from '@mui/material'
import AutovControls from './AutovControls'
import Log, { LogEntry } from '../common/Log'
import { useRef, useState } from 'react'
import { AutovClient, TrialResponse } from './AutovClient'
import { AutovConfig } from './Config'
import TrialStatus from '../common/TrialStatus'
import { TrialState } from '../common/types'
import AvInfo from './AvInfo'
import { AvStatus, TrialLifecycle } from './TrialLifecycle'
import AvState from './AvState'

/* TSC still warns us: */
/* eslint-disable @typescript-eslint/no-unused-vars */
function AutovUi() {
    const [logRows, setLogRows] = useState<LogEntry[]>([])
    const [trialStatus, setTrialStatus] = useState<TrialState>(TrialState.Wait)

    //@ts-expect-error unused var
    const [config, setConfig] = useState<AutovConfig>(new AutovConfig())
    const client = new AutovClient(config)

    const [armed, setArmed] = useState<boolean>(false)
    const [armEnabled, setArmEnabled] = useState<boolean>(true)

    const [avStatus, setAvStatus] = useState<AvStatus>(AvStatus.preInit())

    const [telemRate, setTelemRate] = useState(10)
    const trialLifecycle = useRef<TrialLifecycle | null>(null)

    const updateTelemRate = (rate: number) => {
        if (trialLifecycle.current) {
            trialLifecycle.current.setTelemRate(rate)
        }
        setTelemRate(rate)
        console.debug("Updated telemetry rate to ", rate)
    }

    function appendLog(row: LogEntry) {
        setLogRows([row, ...logRows])
    }

    function logTrialResponse(api: string, response: TrialResponse): boolean {
        const success = response.httpStatus >= 200 && response.httpStatus < 300
        const toLog: LogEntry = {
            api: api,
            success: success,
            sent: '',
            received: JSON.stringify(response.obj),
        }
        appendLog(toLog)
        return success
    }

    async function getTrial() {
        console.log('getTrial')
        const response: TrialResponse = await client.getTrial()
        const success = logTrialResponse('GET /api/trial', response)
        if (success) {
            const state = response.getState() || TrialState.Wait
            setTrialStatus(state)
        }
    }

    async function clearLog() {
        setLogRows([])
    }

    async function resetState() {
        setTrialStatus(TrialState.Wait)
    }

    async function onArm(armed: boolean) {
        console.debug('onArm', armed)
        setArmed(armed)
        if (armed) {
            setTrialStatus(TrialState.Wait)
            setArmEnabled(false)
            setTimeout(async () => {
                const lifecycle = new TrialLifecycle(
                    client,
                    setTrialStatus,
                    setAvStatus,
                    setArmed,
                    appendLog,
                    telemRate,
                )
                trialLifecycle.current = lifecycle
                await lifecycle.start()
                trialLifecycle.current = null
                setArmEnabled(true)
            }, 0)
        }
    }

    return (
        <Box sx={{ border: 1 }} m={2} p={2}>
            <Box
                sx={{
                    textAlign: 'right',
                    borderBottom: 1,
                    borderColor: 'secondary',
                }}
            >
                Autonomy COD Client
            </Box>
            <Grid container spacing={8}>
                <Grid item sx={{ p: 2 }} xs={6}>
                    <AvInfo config={config} />
                </Grid>
                <Grid item sx={{ py: 2 }} xs={6}>
                    <TrialStatus status={trialStatus} />
                </Grid>
            </Grid>
            <AvState avStatus={avStatus} />
            <AutovControls
                onGetTrialStatus={getTrial}
                onClear={clearLog}
                onReset={resetState}
                onArm={onArm}
                armed={armed}
                armEnabled={armEnabled}
                telemRate={telemRate}
                setTelemRate={updateTelemRate}
            />
            <Log rows={logRows} />
        </Box>
    )
}

export default AutovUi
