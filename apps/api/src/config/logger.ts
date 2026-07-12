export const logger = {
    info: (message: string, data?: unknown): void => {
        if (data) {
            console.log(`[INFO] ${message}`, data);
            return;
        }
        console.log(`[INFO] ${message}`);
    },

    error: (message: string, data?: unknown): void => {
        if (data) {
            console.error(`[ERROR] ${message}`, data);
            return;
        }
        console.error(`[ERROR] ${message}`);
    },
};