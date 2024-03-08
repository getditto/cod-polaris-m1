export enum LogLevel {
    debug = 'debug',
    info = 'info',
    warn = 'warn',
    error = 'error',
}
export const DEFAULT_LOG_LEVEL = LogLevel.warn

const ord = [LogLevel.debug, LogLevel.info, LogLevel.warn, LogLevel.error]
// @ts-expect-error global implicitly any
global.loggerLevel = DEFAULT_LOG_LEVEL

function shouldLog(level: LogLevel): boolean {
    // @ts-expect-error global implicitly any
    return ord.indexOf(level) >= ord.indexOf(global.loggerLevel)
}

export function setLogLevel(level: LogLevel) {
    // @ts-expect-error global implicitly any
    global.loggerLevel = level
}
export function setLogLevelStr(levelStr?: string) {
    if (levelStr != null) {
        switch (levelStr!.toLowerCase()) {
            case 'debug':
                setLogLevel(LogLevel.debug)
                break
            case 'info':
                setLogLevel(LogLevel.info)
                break
            case 'warn':
                setLogLevel(LogLevel.warn)
                break
            case 'error':
                setLogLevel(LogLevel.error)
                break
            default:
        }
    }
}

const logFn = console.log
global.console = {
    ...global.console,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (msg?: any, ...args: any[]) => {
        shouldLog(LogLevel.error) && logFn(msg, ...args)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn: (msg?: any, ...args: any[]) => {
        shouldLog(LogLevel.warn) && logFn(msg, ...args)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (msg?: any, ...args: any[]) => {
        shouldLog(LogLevel.info) && logFn(msg, ...args)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug: (msg?: any, ...args: any[]) => {
        shouldLog(LogLevel.debug) && logFn(msg, ...args)
    },
}
