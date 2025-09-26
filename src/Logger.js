export class Logger {
    static LogLevel = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    constructor(logLevel = Logger.LogLevel.INFO, context = null) {
        this.logLevel = logLevel;
        this.context = context;
    }

    setLogLevel(level) {
        this.logLevel = level;
    }

    // Create a child logger with a specific context
    withContext(context) {
        return new Logger(this.logLevel, context);
    }

    _getCallerInfo() {
        // If we have a context, use it
        // if (this.context) {
        //     return this.context;
        // }
        
        const stack = new Error().stack;
        const stackLines = stack.split('\n');
        // Skip Error, _getCallerInfo, and the log method call
        const callerLine = stackLines[4];
        
        if (callerLine) {
            // Try multiple patterns to handle different stack trace formats
            let match;
            
            // Pattern 1: ES6 class methods (e.g., "at ProjectManager.saveFile")
            match = callerLine.match(/at\s+([^.]+)\.([^.\s]+)\s/);
            if (match) {
                return `${this.context || match[1]}.${match[2]}`;
            }
            
            // Pattern 2: Function calls (e.g., "at saveFile")
            match = callerLine.match(/at\3s+([^.\s(]+)/);
            if (match) {
                return `${this.context || "*"}.${match[1]}`;
            }
            
            // Pattern 3: Anonymous functions or arrow functions
            match = callerLine.match(/at\s+Object\.([^.\s(]+)/);
            if (match) {
                return `${this.context || "Object"}.${match[1]}`;
            }

            // Pattern 4: method@....classname
            match = callerLine.match(/([^@]+)@(?:[^/]*\/)*([^/\\]+)\.js:(\d+)/);
            if (match) {
                return `${this.context || match[2]}.${match[1]}.line_${match[3]}`;
            }

            // Pattern 5: File-based pattern as fallback
            match = callerLine.match(/([^/\\]+)\.js:(\d+)/);
            if (match) {
                return `${this.context || match[1]}.line_${match[2]}`;
            }
        }
        return `${this.context || "unknown"}.unknown`;
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
        this._log(Logger.LogLevel.WARN, 'WARN', ...args);
    }

    info(...args) {
        this._log(Logger.LogLevel.INFO, 'INFO ', ...args);
    }

    debug(...args) {
        this._log(Logger.LogLevel.DEBUG, 'DEBUG', ...args);
    }
}