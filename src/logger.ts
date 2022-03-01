import Pino from 'pino';

const logger = Pino();

/**
 * By default, we run the application in error mode.
 * @returns LogLevel
 */
export const getLogLevel = (): LogLevel =>
  (process.env.LOG_LEVEL ?? 'info') as LogLevel;

/**
 * Export the logging interface.
 * we can define themes for each here
 */
export const log = logger;
