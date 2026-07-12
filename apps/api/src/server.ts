import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { pool } from "./db/pool";
import { startLicenseCron } from "./services/licenseCron.service";

const start = async (): Promise<void> => {
    await pool.query("SELECT 1");

    app.listen(env.PORT, () => {
        logger.info(`TransitOps API running on port ${env.PORT}`);
    });

    startLicenseCron();
};

start().catch((error) => {
    logger.error("Failed to start API server", error);
    process.exit(1);
});