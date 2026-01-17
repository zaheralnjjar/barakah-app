export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    details?: any;
}

const LOG_STORAGE_KEY = 'baraka_app_logs';
const MAX_LOGS = 1000;

class LoggerService {
    private logs: LogEntry[] = [];

    constructor() {
        this.loadLogs();
    }

    private loadLogs() {
        try {
            const stored = localStorage.getItem(LOG_STORAGE_KEY);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load logs', e);
        }
    }

    private saveLogs() {
        try {
            // Keep only last MAX_LOGS
            if (this.logs.length > MAX_LOGS) {
                this.logs = this.logs.slice(-MAX_LOGS);
            }
            localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {
            console.error('Failed to save logs', e);
        }
    }

    private addLog(level: LogLevel, message: string, details?: any) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details
        };
        this.logs.push(entry);
        this.saveLogs();

        // Also log to console
        if (level === 'error') {
            console.error(message, details);
        } else if (level === 'warn') {
            console.warn(message, details);
        } else {
            console.log(message, details);
        }
    }

    info(message: string, details?: any) {
        this.addLog('info', message, details);
    }

    warn(message: string, details?: any) {
        this.addLog('warn', message, details);
    }

    error(message: string, details?: any) {
        this.addLog('error', message, details);
    }

    getLogs(): LogEntry[] {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
        localStorage.removeItem(LOG_STORAGE_KEY);
    }

    exportLogs() {
        const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `baraka_logs_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export const logger = new LoggerService();
