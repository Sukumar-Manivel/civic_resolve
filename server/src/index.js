import { createApp } from "./app.js";

/**
 * Starts HTTP server on configured port.
 * @param {number|string} port - Listen port
 * @returns {import("node:http").Server} Running server instance
 */
export function startServer(port) {
  const app = createApp();
  return app.listen(port, () => {
    process.stdout.write(`Server running on port ${port}\n`);
  });
}

/* v8 ignore next 3 */
if (process.env.NODE_ENV !== "test") {
  startServer(process.env.PORT || 8080);
}
