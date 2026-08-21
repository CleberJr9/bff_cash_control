export abstract class AppLogger {
  abstract info(context: Record<string, unknown>, message: string): void;
  abstract error(context: Record<string, unknown>, message: string): void;
  abstract warn(context: Record<string, unknown>, message: string): void;
  abstract debug(context: Record<string, unknown>, message: string): void;
}
