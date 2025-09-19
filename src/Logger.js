export class Logger {
    static LogLevel = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    constructor(logLevel = Logger.LogLevel.INFO) {
        this.logLevel = logLevel;
    }

    setLogLevel(level) {
        this.logLevel = level;
    }

    _getCallerInfo() {
        const stack = new Error().stack;
        const stackLines = stack.split('\n');
        // Skip Error, _getCallerInfo, and the log method call
        const callerLine = stackLines[4];
        
        if (callerLine) {
            const match = callerLine.match(/at (?:(.+?)\.)?(.+?) \(/);
            if (match) {
                const className = match[1] || 'Anonymous';
                const methodName = match[2] || 'unknown';
                return `${className}.${methodName}`;
            }
        }
        return 'unknown.unknown';
    }

    _log(level, levelName, ...args) {
        if (level <= this.logLevel) {
            const caller = this._getCallerInfo();
            console.log(`[${levelName}] ${caller}:`, ...args);
        }
    }

    error(...args) {
        this._log(Logger.LogLevel.ERROR, 'ERROR', ...args);
    }

    warn(...args) {
        this._log(Logger.LogLevel.WARN, 'WARN ', ...args);
    }

    info(...args) {
        this._log(Logger.LogLevel.INFO, 'INFO ', ...args);
    }

    debug(...args) {
        this._log(Logger.LogLevel.DEBUG, 'DEBUG', ...args);
    }
}