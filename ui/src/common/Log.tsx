import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { shortUuid } from './util'
import Success from './Success'

export class LogEntry {
    api: string = ''
    success: boolean = false
    sent: string = ''
    received: string = ''
    public static api(api: string, success: boolean): LogEntry {
        return { api: api, success: success, sent: '', received: '' }
    }
    public static detail(
        api: string,
        success: boolean,
        sent: string,
        received: string
    ): LogEntry {
        return { api: api, success: success, sent: sent, received: received }
    }
}
export type LogCb = (l: LogEntry) => void

function Row(props: { row: LogEntry }) {
    const { row } = props

    return (
        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
            <TableCell component="th" scope="row">
                {row.api}
            </TableCell>
            <TableCell align="right">
                <Success success={row.success} />
            </TableCell>
            <TableCell align="right">{row.sent}</TableCell>
            <TableCell align="right">{row.received}</TableCell>
        </TableRow>
    )
}

export default function Log({ rows }: { rows?: LogEntry[] }) {
    return (
        <div>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ArrowDropDownIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Typography>Log</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <LogContent rows={rows} />
                </AccordionDetails>
            </Accordion>
        </div>
    )
}

function LogContent({ rows }: { rows?: LogEntry[] }) {
    rows = rows || []
    return (
        <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                    <TableRow>
                        <TableCell>API</TableCell>
                        <TableCell align="right">Success</TableCell>
                        <TableCell align="right">Sent</TableCell>
                        <TableCell align="right">Received</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <Row row={row} key={shortUuid()} />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
