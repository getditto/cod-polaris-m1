import { Box, Grid, Paper, Typography, styled } from '@mui/material'
import { AvStatus } from './TrialLifecycle'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import GpsNotFixedIcon from '@mui/icons-material/GpsNotFixed'
import StraightIcon from '@mui/icons-material/Straight'

function Location({ avStatus }: { avStatus: AvStatus }) {
    if (!avStatus.lat || !avStatus.lon) {
        return (
            <div>
                <GpsNotFixedIcon />
            </div>
        )
    } else {
        return (
            <Box
                justifyContent="space-evenly"
                alignItems="center"
                display="flex"
            >
                <GpsFixedIcon />
                <Typography sx={{ fontSize: 14 }}>
                    {avStatus.lat.toFixed(5)}, {avStatus.lon.toFixed(5)}
                </Typography>
            </Box>
        )
    }
}

function CompassIcon({ bearing }: { bearing: number }) {
    // Calculate the rotation angle for the arrow
    const rotation = `rotate(${bearing}deg)`

    return <StraightIcon style={{ transform: rotation }} />
}

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    alignItems: 'center',
    minHeight: 40,
    color: theme.palette.text.secondary,
}))

function AvState({ avStatus }: { avStatus: AvStatus }) {
    //<Typography sx={{ fontSize: 14 }}>
    //</Typography>
    return (
        <Box
            sx={{
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1,
                p: 1,
            }}
        >
            <Grid container spacing={1}>
                <Grid item sm={4} lg={4}>
                    <Item>
                        <Location avStatus={avStatus} />
                    </Item>
                </Grid>
                <Grid item sm={2} lg={2}>
                    <Item>
                        <CompassIcon bearing={avStatus.heading} />
                        {avStatus.heading.toFixed(2)} &deg;
                    </Item>
                </Grid>
                <Grid item sm={3} lg={2}>
                    <Item>{avStatus.missionPhase}</Item>
                </Grid>
                <Grid item sm={3} lg={2}>
                    <Item>{avStatus.behavior}</Item>
                </Grid>
            </Grid>
        </Box>
    )
}

export default AvState
