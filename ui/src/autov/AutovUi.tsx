import { Box, Grid } from '@mui/material'
import AutovControls from './AutovControls'
import Log, { LogEntry } from '../common/Log'
import { useState } from 'react'
import { AutovClient, TrialResponse } from './AutovClient'
import { AutovConfig } from './Config'
import TrialStatus from '../common/TrialStatus'
import { TrialState } from '../common/types'
import AvInfo from './AvInfo'

/* TSC still warns us: */
/* eslint-disable @typescript-eslint/no-unused-vars */
function AutovUi() {
    const [logRows, setLogRows] = useState<LogEntry[]>([])
    const [trialStatus, setTrialStatus] = useState<TrialState>(TrialState.Wait)

    //@ts-expect-error unused var
    const [config, setConfig] = useState<AutovConfig>(new AutovConfig())
    const client = new AutovClient(config)

    async function getTrial() {
        console.log('getTrial')
        const response: TrialResponse = await client.getTrial()
        const detailStr = response.error ?? ''
        const detail = {
            timestamp: response.obj?.timestamp ?? '',
            raw: detailStr,
        }
        const success = response.httpStatus >= 200 && response.httpStatus < 300
        const toLog: LogEntry = {
            api: 'GET /api/trial',
            success: success,
            sent: '',
            received: JSON.stringify(response.obj),
            details: [detail],
        }
        if (success) {
            const state = response.getState() || TrialState.Wait
            setTrialStatus(state)
        }
        setLogRows([toLog, ...logRows])
    }

    async function clearLog() {
        setLogRows([])
    }

    async function resetState() {
        setTrialStatus(TrialState.Wait)
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
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <AvInfo config={config} />
                </Grid>
                <Grid item xs={6}>
                    <TrialStatus status={trialStatus} />
                </Grid>
            </Grid>
            <AutovControls
                onGetTrialStatus={getTrial}
                onClear={clearLog}
                onReset={resetState}
            />
            <Log rows={logRows} />
        </Box>
    )
}

export default AutovUi
