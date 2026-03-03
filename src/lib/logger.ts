const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    info: (...args: any[]) => {
        if (isDev) {
            console.log('\x1b[34m[INFO]\x1b[0m', ...args);
        }
    },
    warn: (...args: any[]) => {
        if (isDev) {
            console.warn('\x1b[33m[WARN]\x1b[0m', ...args);
        }
    },
    error: (message: string, error?: any) => {
        // In local development, we always want to see the full error stack
        if (isDev) {
            console.error('\x1b[31m[ERROR]\x1b[0m', message);
            if (error) {
                if (error.stack) {
                    console.error(error.stack);
                } else {
                    console.error(error);
                }
            }
        } else {
            // In production, we log a minimal message to avoid exposing internals in server logs
            // if they are publicly accessible, but typically server logs are fine.
            // However, the requirement was "not production" for technical details.
            console.error(`[ERROR] ${message}`, error?.message || '');
        }
    },
    debug: (...args: any[]) => {
        if (isDev) {
            console.debug('\x1b[36m[DEBUG]\x1b[0m', ...args);
        }
    }
};
