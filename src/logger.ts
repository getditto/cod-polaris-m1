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

function shouldLog(logLevel: LogLevel, setLevel: LogLevel): boolean {
    return ord.indexOf(logLevel) >= ord.indexOf(setLevel)
}

export function setLogLevel(level: LogLevel) {
    if (!shouldLog(LogLevel.warn, level)) {
        global.console.warn = () => {}
    }
    if (!shouldLog(LogLevel.info, level)) {
        global.console.info = () => {}
    }
    if (!shouldLog(LogLevel.debug, level)) {
        global.console.debug = () => {}
    }
    // @ts-expect-error global implicitly any
    global.loggerLevel = level
}

export function getLogLevel(): LogLevel {
    // @ts-expect-error global implicitly any
    return global.loggerLevel
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
