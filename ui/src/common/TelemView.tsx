import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material'
import { Telemetry } from './types'

function TelemView({ telem }: { telem: Telemetry }) {
    return (
        <TableContainer component={Paper}>
            <Table
                sx={{ minWidth: 650 }}
                size="small"
                aria-label="a dense table"
            >
                <TableHead>
                    <TableRow>
                        <TableCell>Location</TableCell>
                        <TableCell>Alt.</TableCell>
                        <TableCell>ID</TableCell>
                        <TableCell>Heading</TableCell>
                        <TableCell>Behavior</TableCell>
                        <TableCell>Mission Phase</TableCell>
                        <TableCell>Phase Loc</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {telem.map((row) => (
                        <TableRow
                            key={row.id}
                            sx={{
                                '&:last-child td, &:last-child th': {
                                    border: 0,
                                },
                            }}
                        >
                            <TableCell component="th" scope="row">
                                {row.lat}, {row.lon}
                            </TableCell>
                            <TableCell>{row.alt}</TableCell>
                            <TableCell>{row.id}</TableCell>
                            <TableCell>{row.heading}</TableCell>
                            <TableCell>{row.behavior}</TableCell>
                            <TableCell>{row.mission_phase}</TableCell>
                            <TableCell>{row.phase_loc.type}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default TelemView
