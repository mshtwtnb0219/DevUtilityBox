interface LogEntry {
  toolName: string
  operation: string
  status: "success" | "warning" | "error"
  details: string
  duration: number
  filesProcessed?: number
  errorMessage?: string
}

class LogManager {
  private static instance: LogManager
  private logs: LogEntry[] = []

  private constructor() {}

  public static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager()
    }
    return LogManager.instance
  }

  public addLog(log: LogEntry): void {
    this.logs.push(log)
    console.log("Log added:", log) // You can customize logging behavior here
  }

  public getLogs(): LogEntry[] {
    return [...this.logs] // Return a copy to prevent external modification
  }

  // Optional: Method to clear logs
  public clearLogs(): void {
    this.logs = []
  }
}

export { LogManager }
