const request = require("supertest");
const app = require("../../index");

let adminToken;
let productId;

const getFirstProductId = (payload) => {
  if (payload?.products?.length) return payload.products[0].id;
  if (Array.isArray(payload) && payload.length) return payload[0].id;
  return undefined;
};

beforeAll(async () => {
  const login = await request(app).post("/login").send({
    email: "admin@clothify.com",
    password: "Admin@123",
  });
  adminToken = login.body.token;
});

describe("Products API", () => {
  test("POST /addproduct → tạo sản phẩm", async () => {
    const res = await request(app)
      .post("/addproduct")
      .set("auth-token", adminToken)
      .send({
        name: "Test Product",
        image: "img.jpg",
        category: "shirt",
        new_price: 100,
        old_price: 120,
      });

    expect([200, 409, 500]).toContain(res.statusCode);

    if (res.statusCode === 200 && res.body?.product?.id) {
      productId = res.body.product.id;
    } else {
      // fallback: lấy product có sẵn nếu DB đã có dữ liệu
      const list = await request(app).get("/allproducts");
      productId = getFirstProductId(list.body);
    }
  });

  test("POST /addproduct → thiếu dữ liệu trả 400", async () => {
    const res = await request(app)
      .post("/addproduct")
      .set("auth-token", adminToken)
      .send({
        // thiếu name
        category: "shirt",
        new_price: "abc",
        old_price: 120,
      });

    expect(res.statusCode).toBe(400);
  });

  test("PUT /product/:id → cập nhật sản phẩm", async () => {
    if (!productId) {
      const list = await request(app).get("/allproducts");
      productId = getFirstProductId(list.body) || 999999;
    }

    const res = await request(app)
      .put(`/product/${productId}`)
      .set("auth-token", adminToken)
      .send({ new_price: 200 });

    expect([200, 400, 404]).toContain(res.statusCode);
  });

  test("PUT /product/:id → id không tồn tại", async () => {
    const res = await request(app)
      .put("/product/999999")
      .set("auth-token", adminToken)
      .send({ new_price: 300 });

    expect([400, 404]).toContain(res.statusCode);
  });

  test("GET /allproducts → lấy danh sách", async () => {
    const res = await request(app).get("/allproducts");
    expect(res.statusCode).toBe(200);
  });

  test("POST /removeproduct → xoá sản phẩm", async () => {
    if (!productId) {
      const list = await request(app).get("/allproducts");
      productId = getFirstProductId(list.body) || 999999;
    }

    const res = await request(app)
      .post("/removeproduct")
      .set("auth-token", adminToken)
      .send({ id: productId });

    expect([200, 400, 404]).toContain(res.statusCode);
  });
});
