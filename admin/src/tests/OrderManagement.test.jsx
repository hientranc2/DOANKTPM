import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

import OrderManagement from "../Components/OrderManagement/OrderManagement";

// Mock data cho API /orders
const mockOrders = [
  {
    orderId: 1,
    status: "pending",
    createdAt: "2025-01-01T10:00:00Z",
    total: 150000,
    customer: {
      name: "Nam",
      email: "nam@test.com",
    },
    items: [
      { productId: 10, name: "Áo Thun", quantity: 2, price: 75000 },
    ],
  },
  {
    orderId: 2,
    status: "processing",
    createdAt: "2025-01-02T12:00:00Z",
    total: 200000,
    customer: {
      name: "Lan",
      email: "lan@test.com",
    },
    items: [
      { productId: 20, name: "Quần Jeans", quantity: 1, price: 200000 },
    ],
  },
];

describe("OrderManagement – frontend unit test (Vitest)", () => {
  beforeEach(() => {
    global.fetch = vi.fn((url, options) => {
      // GET /orders
      if (url.includes("/orders") && (!options || options.method === "GET")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              orders: mockOrders,
            }),
        });
      }

      // PATCH /orders/1
      if (url.includes("/orders/1") && options?.method === "PATCH") {
        const body = JSON.parse(options.body || "{}");
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              order: { ...mockOrders[0], status: body.status },
            }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({ success: false, message: "Unknown URL" }),
      });
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("lọc theo trạng thái: chọn 'pending' chỉ còn 1 đơn pending", async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/Trạng thái/i);
    fireEvent.change(statusSelect, { target: { value: "pending" } });

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/Đơn #1/)).toBeInTheDocument();
      expect(screen.queryByText(/Đơn #2/)).not.toBeInTheDocument();
    });
  });

  test("tìm kiếm theo tên khách hoặc sản phẩm", async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/Tìm kiếm/i);

    fireEvent.change(searchInput, { target: { value: "Lan" } });

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/Đơn #2/)).toBeInTheDocument();
      expect(screen.queryByText(/Đơn #1/)).not.toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: "Áo Thun" } });

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText(/Đơn #1/)).toBeInTheDocument();
      expect(screen.queryByText(/Đơn #2/)).not.toBeInTheDocument();
    });
  });

  test("handleStatusChange: đổi trạng thái đơn và hiện feedback", async () => {
    render(<OrderManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Đơn #1/)).toBeInTheDocument();
    });

    const selects = screen.getAllByRole("combobox");
    const orderStatusSelect = selects[1];

    fireEvent.change(orderStatusSelect, {
      target: { value: "shipped" },
    });

    // ✅ FIX CHỖ NÀY
    await waitFor(() => {
      const patchCall = global.fetch.mock.calls.find(
        ([url, options]) =>
          url.includes("/orders/1") && options?.method === "PATCH"
      );

      expect(patchCall).toBeTruthy();

      const [, options] = patchCall;
      expect(options.body).toBe(JSON.stringify({ status: "shipped" }));
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Đã cập nhật trạng thái đơn hàng/i)
      ).toBeInTheDocument();
    });
  });
});
