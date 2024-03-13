import * as React from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { shortUuid } from './util'
import Success from './Success'

export class Detail {
    timestamp: string = ''
    raw: string = ''
}

export class LogEntry {
    api: string = ''
    success: boolean = false
    sent: string = ''
    received: string = ''
    details: Detail[] = []
}

//function createData(api: string, success: boolean, sent: string, received: string,
//    details: Detail[]): LogEntry {
//    return {
//        api,
//        success,
//        sent,
//        received,
//        details,
//    };
//}

function Row(props: { row: LogEntry }) {
    const { row } = props
    const [open, setOpen] = React.useState(false)

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? (
                            <KeyboardArrowUpIcon />
                        ) : (
                            <KeyboardArrowDownIcon />
                        )}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    {row.api}
                </TableCell>
                <TableCell align="right">
                    <Success success={row.success} />
                </TableCell>
                <TableCell align="right">{row.sent}</TableCell>
                <TableCell align="right">{row.received}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={6}
                >
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                component="div"
                            >
                                History
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Timestamp</TableCell>
                                        <TableCell>Raw</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.details.map((detailRow) => (
                                        <TableRow key={detailRow.timestamp}>
                                            <TableCell
                                                component="th"
                                                scope="row"
                                            >
                                                {detailRow.timestamp}
                                            </TableCell>
                                            <TableCell>
                                                {detailRow.raw}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}

// const mockRows = [
//     createData('GET /api/trial', true, "", "Trial Response Summary", [{ timestamp: Date.now().toString(), raw: 'Trial response raw' }]),
//     createData('GET /api/trial', false, "", "Trial Response Summary", [{ timestamp: Date.now().toString(), raw: 'Trial response raw' }]),
//     createData('GET /api/trial', true, "", "Trial Response Summary", [{ timestamp: Date.now().toString(), raw: 'Trial response raw' }]),
//     createData('GET /api/trial', true, "", "Trial Response Summary", [{ timestamp: Date.now().toString(), raw: 'Trial response raw' }]),
// ];

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
    //rows = rows || mockRows
    rows = rows || []
    return (
        <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                    <TableRow>
                        <TableCell />
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
