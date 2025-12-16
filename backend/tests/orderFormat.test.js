process.env.NODE_ENV = "test";

const { formatOrderResponse } = require("../index");

describe("formatOrderResponse - Unit Test", () => {

  test("khách đã đăng ký (có customer_id)", () => {
    const order = {
      order_id: 1,
      status: "pending",
      total: "150000",
      created_at: "2025-01-01",
      customer_id: 10,
      user_name: "Nam",
      user_email: "nam@test.com",
      user_status: "active",
    };

    const items = [
      { product_id: 5, name: "Áo", quantity: 2, price: "75000" }
    ];

    const result = formatOrderResponse(order, items);

    expect(result.orderId).toBe(1);
    expect(result.total).toBe(150000);
    expect(result.customer).toEqual({
      id: 10,
      name: "Nam",
      email: "nam@test.com",
      status: "active",
    });
  });

  test("khách vãng lai (không có customer_id)", () => {
    const order = {
      order_id: 2,
      status: "pending",
      total: 200000,
      created_at: "2025-01-01",
      customer_id: null,
      customer_name: "Guest",
      customer_email: "guest@test.com"
    };

    const result = formatOrderResponse(order, []);

    expect(result.customer).toEqual({
      name: "Guest",
      email: "guest@test.com"
    });
    expect(result.items).toEqual([]);
  });

  test("ép total thành Number", () => {
    const order = {
      order_id: 3,
      status: "processing",
      total: "300000",
      created_at: "2025-01-01",
      customer_id: 1,
      user_name: "Hai",
      user_email: "hai@test.com"
    };

    const result = formatOrderResponse(order, []);

    expect(typeof result.total).toBe("number");
    expect(result.total).toBe(300000);
  });

});
