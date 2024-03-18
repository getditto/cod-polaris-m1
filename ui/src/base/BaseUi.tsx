import { Box, Grid } from '@mui/material'
import Log, { LogEntry } from '../common/Log'
import BaseInfo from './BaseInfo'
import BaseCommands from './BaseCommands'
import TrialStatus from '../common/TrialStatus'
import { BaseClient, StartEndResponse } from './BaseClient'
import { TelemRecord, Telemetry, TrialState } from '../common/types'
import { useState, useRef } from 'react'
import TelemView from '../common/TelemView'
import { DEFAULT_TELEMETRY } from '../common/Default'
import { BaseConfig } from './BaseConfig'
import { assert, genTrialIds } from '../common/util'
import { TelemReader } from './TelemReader'

function BaseUi({ config }: { config: BaseConfig }) {
    const [trialStatus, setTrialStatus] = useState<TrialState>(TrialState.Wait)
    const [logRows, setLogRows] = useState<LogEntry[]>([])
    const [telem, setTelem] = useState<Telemetry>(DEFAULT_TELEMETRY)
    const trialIds = genTrialIds()
    const [trialId, setTrialId] = useState(trialIds[0])

    const client = useRef(new BaseClient(config))
    const telemReader = useRef(
        new TelemReader(client.current, appendTelemArray, appendLog)
    )
    assert(telemReader.current != null, 'current null')
    assert(
        telemReader.current.running != null &&
            telemReader.current.running != undefined,
        'running null'
    )
    telemReader.current.start()

    function appendTelemArray(telem: TelemRecord[]) {
        console.debug('Add telemetry: ', telem)
        setTelem((prev) => [...telem, ...prev])
    }

    function appendLog(row: LogEntry) {
        setLogRows((prev) => [row, ...prev])
    }

    function responseToLog(response: StartEndResponse, api: string): LogEntry {
        const success = response.httpStatus >= 200 && response.httpStatus < 300
        const toLog: LogEntry = {
            api: api,
            success: success,
            sent: '',
            received: '',
        }
        console.debug('Add log ', toLog)
        return toLog
    }

    async function sendStart() {
        const response = await client.current.startTrial(trialId)
        if (response.httpStatus == 200) {
            setTrialStatus(TrialState.Start)
        }
        const success = response.httpStatus == 201
        if (success) {
            const state = response.getState()
            setTrialStatus(state)
        }
        const toLog = responseToLog(response, 'POST /api/trial_start')
        appendLog(toLog)
    }

    async function sendEnd() {
        const response = await client.current.endTrial(trialId)
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
        appendLog(toLog)
    }

    async function onClear() {
        setLogRows([])
        setTelem([])
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
            <Box sx={{ pt: 4 }}>
                <TelemView telem={telem} />
            </Box>
            <Box sx={{ pt: 4 }}>
                <Log rows={logRows} />
            </Box>
        </Box>
    )
}

export default BaseUi
