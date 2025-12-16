// src/tests/shopContext.test.jsx
import React, { useContext } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ShopContextProvider, { ShopContext } from "../Context/ShopContext";

// ----- MOCK fetch để ShopContext không gọi API thật -----
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: "Áo thun",
          new_price: 100000,
          old_price: 120000,
          image: "/img1.jpg",
        },
        {
          id: 2,
          name: "Quần jean",
          new_price: 200000,
          old_price: 250000,
          image: "/img2.jpg",
        },
      ],
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

// ----- Component giả dùng context để test các hàm -----
const TestConsumer = () => {
  const {
    addToCart,
    removeFromCart,
    setCartItemQuantity,
    getTotalCartItems,
    getTotalCartAmount,
  } = useContext(ShopContext);

  return (
    <div>
      <div data-testid="total-items">{getTotalCartItems()}</div>
      <div data-testid="total-amount">{getTotalCartAmount()}</div>

      <button
        data-testid="add-product-1"
        onClick={() => addToCart(1, "M", 1)}
      >
        Add P1-M
      </button>

      <button
        data-testid="remove-product-1"
        onClick={() => removeFromCart(1, "M")}
      >
        Remove P1-M
      </button>

      <button
        data-testid="set-product-1-qty-5"
        onClick={() => setCartItemQuantity(1, "M", 5)}
      >
        Set P1-M = 5
      </button>

      <button
        data-testid="clear-product-1"
        onClick={() => setCartItemQuantity(1, "M", 0)}
      >
        Clear P1-M
      </button>
    </div>
  );
};

// Helper render đầy đủ provider + consumer
const renderWithProvider = () =>
  render(
    <ShopContextProvider>
      <TestConsumer />
    </ShopContextProvider>
  );

// ================== TESTS ==================

describe("ShopContext - cart logic (unit/component tests)", () => {
  test("ban đầu giỏ hàng rỗng: total items = 0, total amount = 0", async () => {
    renderWithProvider();

    // chờ fetch products xong
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/allproducts")
      )
    );

    expect(screen.getByTestId("total-items")).toHaveTextContent("0");
    expect(screen.getByTestId("total-amount")).toHaveTextContent("0");
  });

  test("addToCart: thêm sản phẩm làm tăng tổng số lượng", async () => {
    renderWithProvider();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const addButton = screen.getByTestId("add-product-1");

    // click 1 lần
    fireEvent.click(addButton);
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("1")
    );

    // click thêm 2 lần nữa
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("3")
    );
  });

  test("removeFromCart: giảm số lượng, khi về 0 thì không âm", async () => {
    renderWithProvider();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const addButton = screen.getByTestId("add-product-1");
    const removeButton = screen.getByTestId("remove-product-1");

    // Add 2
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("2")
    );

    // Remove 1 -> còn 1
    fireEvent.click(removeButton);
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("1")
    );

    // Remove tiếp -> về 0, không âm
    fireEvent.click(removeButton);
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("0")
    );
  });

  test("setCartItemQuantity: set số lượng cụ thể", async () => {
    renderWithProvider();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const setQtyButton = screen.getByTestId("set-product-1-qty-5");

    fireEvent.click(setQtyButton);

    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("5")
    );
  });

  test("setCartItemQuantity: set = 0 thì xoá khỏi giỏ", async () => {
    renderWithProvider();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const setQtyButton = screen.getByTestId("set-product-1-qty-5");
    const clearButton = screen.getByTestId("clear-product-1");

    fireEvent.click(setQtyButton);
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("5")
    );

    fireEvent.click(clearButton);
    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("0")
    );
  });

  test("getTotalCartAmount: tính đúng tổng tiền theo giá product từ backend", async () => {
    renderWithProvider();
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const addButton = screen.getByTestId("add-product-1");

    // P1 new_price = 100000, add 3 cái
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    await waitFor(() =>
      expect(screen.getByTestId("total-items")).toHaveTextContent("3")
    );

    // tổng tiền = 3 * 100000 = 300000
    await waitFor(() =>
      expect(screen.getByTestId("total-amount")).toHaveTextContent("300000")
    );
  });
});
