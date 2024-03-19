import { Box } from '@mui/material'
import { Telemetry } from './types'
import { DataGrid } from '@mui/x-data-grid'
import { shortUuid } from './util'

const columns = [
    { field: 'lat', headerName: 'Lat', flex: 1 },
    { field: 'lon', headerName: 'Lon', flex: 1 },
    { field: 'avId', headerName: 'ID', flex: 1 },
    { field: 'heading', headerName: 'Heading', flex: 1 },
    { field: 'mission_phase', headerName: 'Mission Phase', flex: 1 },
    { field: 'behavior', headerName: 'Behavior', flex: 1 },
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
            mission_phase: t.mission_phase,
            behavior: t.behavior,
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
