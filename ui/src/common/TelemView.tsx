import { Box } from '@mui/material'
import { Telemetry } from './types'
import { DataGrid } from '@mui/x-data-grid'
import { shortUuid } from './util'

const columns = [
    { field: 'lat', headerName: 'Lat' },
    { field: 'lon', headerName: 'Lon' },
    { field: 'avId', headerName: 'ID' },
    { field: 'heading', headerName: 'Heading' },
    { field: 'behavior', headerName: 'Behavior' },
    { field: 'mission_phase', headerName: 'Mission Phase' },
]

function TelemView({ telem }: { telem: Telemetry }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rows = telem.map((t, _idx) => {
        const o = {
            id: shortUuid(),
            lat: t.lat.toFixed(5),
            lon: t.lon.toFixed(5),
            avId: t.id,
            heading: `${t.heading.toFixed(2)} °`,
            behavior: t.behavior,
            mission_phase: t.mission_phase,
        }
        return o
    })

    return (
        <div style={{ width: '100%' }}>
            <Box sx={{ height: 400, width: '100%' }}>
                <DataGrid columns={columns} rows={rows} />
            </Box>
        </div>
    )
}

export default TelemView
