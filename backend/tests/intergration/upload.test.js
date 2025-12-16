const request = require("supertest");
const app = require("../../index");

describe("Upload API", () => {
  test("POST /upload → upload ảnh hợp lệ", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("product", Buffer.from("fake-image-bytes"), "test.jpg");

    expect(res.statusCode).toBe(200);
    expect(res.body?.image_url).toBeDefined();
  });
});
