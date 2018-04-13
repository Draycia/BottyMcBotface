export default abstract class Logger {
  private static shouldDevLog = false;

  private static logMain(color: string, severity:string, message: string) {
    let dateTime = new Date().toISOString().replace('T', ' ').substr(0, 19);
    console.log(`[${dateTime}] ${color}${severity}${message}\x1b[0m`);
  }

  public static warn(str: string) {
    this.logMain("\x1b[31m", "[WARN] ", str);
  }

  public static info(str: string) {
    this.logMain("\x1b[33m", "[INFO] ", str);
  }

  public static log(str: string) {
    this.logMain("", "", str);
  }

  public static dev(str: string) {
    if (!this.shouldDevLog) return;
    this.logMain("\x1b[36m", "[DEV] ", str);
  }

  public static setDevLogging(shouldDevLog: boolean) {
    this.shouldDevLog = shouldDevLog;
  }
}