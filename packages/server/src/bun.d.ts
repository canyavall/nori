// Minimal Bun global types for server entry point
declare namespace Bun {
  interface ServeOptions {
    port?: number;
    fetch: (request: Request) => Response | Promise<Response>;
  }
  function serve(options: ServeOptions): void;
}
