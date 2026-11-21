import { describe, it, expect } from "vitest";
import { createApp, handleHealth } from "../src/app.js";
import { startServer } from "../src/index.js";

describe("Health Handler Unit Tests", () => {
  it("should return status 200 and json payload", () => {
    let statusCode = 0;
    let responseBody = null;
    const req = {};
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        responseBody = payload;
        return this;
      }
    };

    handleHealth(req, res);
    expect(statusCode).toBe(200);
    expect(responseBody.status).toBe("ok");
    expect(responseBody.service).toBe("h2s-100-starter");
    expect(responseBody.timestamp).toBeDefined();
  });
});

describe("Express App Unit Tests", () => {
  it("should instantiate express application with health route", () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.use).toBe("function");
    expect(typeof app.get).toBe("function");
  });

  it("should start server via startServer helper and bind cleanly", async () => {
    const server = startServer(0);
    expect(server).toBeDefined();
    await new Promise((resolve) => server.once("listening", resolve));
    await new Promise((resolve) => server.close(resolve));
  });
});
