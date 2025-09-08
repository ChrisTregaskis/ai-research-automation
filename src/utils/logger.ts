/**
 * Console logging utility with file prefixes and color support
 * Provides consistent logging across the application with contextual information
 */

// ANSI color codes for console output
const Colors = {
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Red: '\x1b[31m',
  Green: '\x1b[32m',
  Yellow: '\x1b[33m',
  Blue: '\x1b[34m',
  Magenta: '\x1b[35m',
  Cyan: '\x1b[36m',
  White: '\x1b[37m',
  Gray: '\x1b[90m',
} as const;

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

interface LoggerConfig {
  prefix: string;
  enableColors: boolean;
  enableTimestamps: boolean;
}

/**
 * Creates a logger instance with a specific context prefix
 * @param prefix - The file or module name to prefix log messages
 * @param config - Optional configuration for colors and timestamps
 * @returns Logger instance with contextual logging methods
 */
export function createLogger(
  prefix: string,
  config: Partial<LoggerConfig> = {}
): Record<LogLevel, (message: string, ...args: unknown[]) => void> {
  const defaultConfig: LoggerConfig = {
    prefix,
    enableColors: process.env.NODE_ENV !== 'production',
    enableTimestamps: true,
    ...config,
  };

  /**
   * Formats a log message with color, timestamp, and prefix
   */
  const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = defaultConfig.enableTimestamps
      ? `[${new Date().toISOString()}]`
      : '';

    const coloredPrefix = defaultConfig.enableColors
      ? `${Colors.Cyan}[${defaultConfig.prefix}]${Colors.Reset}`
      : `[${defaultConfig.prefix}]`;

    const levelColors: Record<LogLevel, string> = {
      info: Colors.Blue,
      warn: Colors.Yellow,
      error: Colors.Red,
      debug: Colors.Gray,
      success: Colors.Green,
    };

    const coloredLevel = defaultConfig.enableColors
      ? `${levelColors[level]}${level.toUpperCase()}${Colors.Reset}`
      : level.toUpperCase();

    return `${timestamp} ${coloredPrefix} ${coloredLevel}: ${message}`;
  };

  /**
   * Generic log function that handles formatting and output
   */
  const log = (level: LogLevel, message: string, ...args: unknown[]): void => {
    const formattedMessage = formatMessage(level, message);
    
    // Use appropriate console method based on level
    switch (level) {
      case 'error':
        //@ts-ignore - Logger file allowing console logs
        console.error(formattedMessage, ...args);
        break;
      case 'warn':
        //@ts-ignore - Logger file allowing console logs
        console.warn(formattedMessage, ...args);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          //@ts-ignore - Logger file allowing console logs
          console.debug(formattedMessage, ...args);
        }
        break;
      default:
        //@ts-ignore - Logger file allowing console logs
        console.log(formattedMessage, ...args);
    }
  };

  return {
    info: (message: string, ...args: unknown[]) => log('info', message, ...args),
    warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
    error: (message: string, ...args: unknown[]) => log('error', message, ...args),
    debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
    success: (message: string, ...args: unknown[]) => log('success', message, ...args),
  };
}

/**
 * Default application logger for general use
 */
export const logger = createLogger('app');

/**
 * Creates a logger specifically for a service or module
 * @param moduleName - Name of the module (e.g., 'research-service', 'email-service')
 * @returns Configured logger instance
 */
export const createModuleLogger = (moduleName: string) => createLogger(moduleName);
