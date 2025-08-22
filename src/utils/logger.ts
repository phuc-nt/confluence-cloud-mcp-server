export class Logger {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  info(message: string, ...args: any[]): void {
    console.error(`[${this.name}] INFO: ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.name}] ERROR: ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.error(`[${this.name}] WARN: ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.error(`[${this.name}] DEBUG: ${message}`, ...args);
  }
}