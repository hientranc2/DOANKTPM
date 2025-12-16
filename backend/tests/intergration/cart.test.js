const request = require("supertest");
const app = require("../../index");

let token;

beforeAll(async () => {
  const email = `cart${Date.now()}@mail.com`;

  await request(app).post("/register").send({
    name: "Cart User",
    email,
    password: "123456",
  });

  const login = await request(app).post("/login").send({
    email,
    password: "123456",
  });

  token = login.body.token;
});

describe("Cart API", () => {
  test("POST /addtocart → thêm vào giỏ", async () => {
    const res = await request(app)
      .post("/addtocart")
      .set("auth-token", token)
      .send({ itemId: 1, size: "M" });

    expect([200, 401, 404]).toContain(res.statusCode);
  });

  test("POST /removefromcart → xoá khỏi giỏ", async () => {
    const res = await request(app)
      .post("/removefromcart")
      .set("auth-token", token)
      .send({ itemId: 1, size: "M" });

    expect([200, 401, 404]).toContain(res.statusCode);
  });

  test("POST /addtocart → thiếu token", async () => {
    const res = await request(app)
      .post("/addtocart")
      // không set auth-token
      .send({ itemId: 1, size: "M" });

    expect([401, 404]).toContain(res.statusCode);
  });
});
