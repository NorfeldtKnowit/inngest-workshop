export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: unknown[]) => {
      originalLog('\n');
      originalLog(...args);
    };

    console.error = (...args: unknown[]) => {
      originalError('\n');
      originalError(...args);
    };

    console.warn = (...args: unknown[]) => {
      originalWarn('\n');
      originalWarn(...args);
    };
  }
}
