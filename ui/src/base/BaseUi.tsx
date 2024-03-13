import { Box, Grid } from '@mui/material'
import Log, { LogEntry } from '../common/Log'
import BaseInfo from './BaseInfo'
import BaseCommands from './BaseCommands'
import TrialStatus from '../common/TrialStatus'
import { BaseClient, StartEndResponse } from './BaseClient'
import { Telemetry, TrialState } from '../common/types'
import { useState } from 'react'
import TelemView from '../common/TelemView'
import { DEFAULT_TELEMETRY } from '../common/Default'
import { BaseConfig } from './BaseConfig'
import { genTrialIds } from '../common/util'

/* TSC still warns us: */
/* eslint-disable @typescript-eslint/no-unused-vars */

function BaseUi() {
    // @ts-expect-error unused var
    const [config, setConfig] = useState<BaseConfig>(new BaseConfig())
    const [trialStatus, setTrialStatus] = useState<TrialState>(TrialState.Wait)
    const [logRows, setLogRows] = useState<LogEntry[]>([])
    // @ts-expect-error unused var
    const [telem, setTelem] = useState<Telemetry>(DEFAULT_TELEMETRY)
    const trialIds = genTrialIds()
    const [trialId, setTrialId] = useState(trialIds[0])

    const client = new BaseClient(config)

    function responseToLog(response: StartEndResponse, api: string): LogEntry {
        const detailStr = response.response ?? ''
        const detail = {
            timestamp: response.timestamp,
            raw: detailStr,
        }
        const success = response.httpStatus >= 200 && response.httpStatus < 300
        const toLog: LogEntry = {
            api: api,
            success: success,
            sent: '',
            received: '',
            details: [detail],
        }
        console.debug('responseToLog ', response, ' -> ', toLog)
        return toLog
    }

    async function sendStart() {
        const response = await client.startTrial(trialId)
        if (response.httpStatus == 200) {
            setTrialStatus(TrialState.Start)
        }
        const success = response.httpStatus == 201
        if (success) {
            const state = response.getState()
            setTrialStatus(state)
        }
        const toLog = responseToLog(response, 'POST /api/trial_start')
        setLogRows([toLog, ...logRows])
    }

    async function sendEnd() {
        const response = await client.endTrial(trialId)
        if (response.httpStatus == 200) {
            setTrialStatus(TrialState.End)
        }
        const success =
            response.httpStatus == 200 ||
            response.httpStatus == 201 ||
            response.httpStatus == 204
        if (success) {
            const state = response.getState()
            setTrialStatus(state)
        }
        const toLog = responseToLog(response, 'POST /api/trial_end')
        setLogRows([toLog, ...logRows])
    }

    async function onClear() {
        setLogRows([])
    }

    async function onIdChange(event: React.ChangeEvent<{ value: unknown }>) {
        setTrialId(event.target.value as string)
    }

    return (
        <Box sx={{ border: 1 }} m={2} p={2}>
            <Box
                sx={{
                    textAlign: 'right',
                    borderBottom: 1,
                    borderColor: 'primary',
                }}
            >
                Command Post COD Client
            </Box>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <BaseInfo config={config} />
                </Grid>
                <Grid item xs={6}>
                    <TrialStatus status={trialStatus} />
                </Grid>
            </Grid>
            <Box sx={{ pt: 2 }}>
                <BaseCommands
                    onStart={sendStart}
                    onEnd={sendEnd}
                    onClear={onClear}
                    onIdChange={onIdChange}
                    trialId={trialId}
                    trialIds={trialIds}
                />
            </Box>
            <div>
                <TelemView telem={telem} />
            </div>
            <Box sx={{ pt: 4 }}>
                <Log rows={logRows} />
            </Box>
        </Box>
    )
}

export default BaseUi
