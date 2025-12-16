const request = require("supertest");
const app = require("../../index");

describe("Healthcheck", () => {
  test("GET / → server chạy", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Express App is running with PostgreSQL");
  });
});
