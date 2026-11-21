import { describe, it, expect, vi } from "vitest";
import { createApp, handleNotFound, handleErrors } from "../src/app.js";
import { startServer } from "../src/index.js";

describe("Express App Instantiation", () => {
  it("should instantiate express application with routes mounted cleanly", () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.use).toBe("function");
  });
});

describe("404 Not Found Middleware", () => {
  it("returns 404 with HTTP method and path for unmapped routes", () => {
    let statusCode = 0;
    let body = null;
    const req = { method: "GET", path: "/api/unknown" };
    const res = {
      status(c) {
        statusCode = c;
        return this;
      },
      json(b) {
        body = b;
        return this;
      }
    };
    handleNotFound(req, res);
    expect(statusCode).toBe(404);
    expect(body.error).toBe("Cannot GET /api/unknown");
  });
});

describe("Error Handling Middleware", () => {
  it("delegates to next when headers are already sent", () => {
    const err = new Error("Already sent");
    const req = {};
    const res = { headersSent: true };
    const next = vi.fn();

    handleErrors(err, req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("writes stderr and returns 500 when headers not sent", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    let statusCode = 0;
    let body = null;
    const res = {
      headersSent: false,
      status(c) {
        statusCode = c;
        return this;
      },
      json(b) {
        body = b;
        return this;
      }
    };
    handleErrors(new Error("Unhandled exception"), {}, res, vi.fn());
    expect(statusCode).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(stderrSpy).toHaveBeenCalled();
    stderrSpy.mockRestore();
  });
});

describe("Ephemeral Server Binding", () => {
  it("should start server via startServer helper and bind cleanly", async () => {
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const server = startServer(0);
    expect(server).toBeDefined();
    await new Promise((resolve) => server.once("listening", resolve));
    await new Promise((resolve) => server.close(resolve));
    expect(stdoutSpy).toHaveBeenCalled();
    stdoutSpy.mockRestore();
  });
});
