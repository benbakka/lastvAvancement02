// Global TypeScript declarations for the project

interface Window {
  /**
   * Object to track timeouts for debouncing progress updates
   * Keys are task IDs and values are timeout IDs
   */
  progressUpdateTimeouts?: {
    [taskId: string]: NodeJS.Timeout;
  };
}
