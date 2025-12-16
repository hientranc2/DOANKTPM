// src/tests/CartItems.test.jsx
import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import CartItems from '../Components/CartItems/CartItems';
import { ShopContext } from '../Context/ShopContext';
import { AuthContext } from '../Context/AuthContext';

// mock useNavigate để theo dõi điều hướng
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderCart = ({
  shopOverrides = {},
  authOverrides = {},
} = {}) => {
  const defaultShop = {
    products: [],
    cartItems: {},
    getTotalCartAmount: jest.fn(() => 0),
    getTotalCartItems: jest.fn(() => 0),
    removeFromCart: jest.fn(),
    addToCart: jest.fn(),
    setCartItemQuantity: jest.fn(),
    loadingProducts: false,
  };

  const defaultAuth = {
    isAuthenticated: false,
  };

  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{ ...defaultAuth, ...authOverrides }}
      >
        <ShopContext.Provider
          value={{ ...defaultShop, ...shopOverrides }}
        >
          <CartItems />
        </ShopContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('CartItems – unit tests', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('handleCheckout: giỏ hàng trống → không navigate, không message', () => {
    renderCart({
      shopOverrides: {
        getTotalCartItems: jest.fn(() => 0),
        getTotalCartAmount: jest.fn(() => 0),
      },
    });

    const checkoutButton = screen.getByText(
      /TIẾN HÀNH THANH TOÁN/i
    );
    fireEvent.click(checkoutButton);

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.queryByText(
        /Vui lòng đăng nhập để có thể thanh toán\./i
      )
    ).not.toBeInTheDocument();
  });

  test('handleCheckout: có hàng nhưng chưa đăng nhập → hiện message, không navigate', () => {
    renderCart({
      shopOverrides: {
        getTotalCartItems: jest.fn(() => 2),
        getTotalCartAmount: jest.fn(() => 100000),
      },
      authOverrides: {
        isAuthenticated: false,
      },
    });

    const checkoutButton = screen.getByText(
      /TIẾN HÀNH THANH TOÁN/i
    );
    fireEvent.click(checkoutButton);

    expect(
      screen.getByText(
        /Vui lòng đăng nhập để có thể thanh toán\./i
      )
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handleCheckout: có hàng và đã đăng nhập → navigate tới /checkout', () => {
    renderCart({
      shopOverrides: {
        getTotalCartItems: jest.fn(() => 3),
        getTotalCartAmount: jest.fn(() => 150000),
      },
      authOverrides: {
        isAuthenticated: true,
      },
    });

    const checkoutButton = screen.getByText(
      /TIẾN HÀNH THANH TOÁN/i
    );
    fireEvent.click(checkoutButton);

    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  test('totalAmount hiển thị đúng theo getTotalCartAmount và formatCurrency', () => {
    renderCart({
      shopOverrides: {
        getTotalCartItems: jest.fn(() => 2),
        getTotalCartAmount: jest.fn(() => 150000),
      },
    });

    // Tạm tính hoặc Tổng cộng đều dùng formatCurrency
    expect(
      screen.getAllByText('150.000đ').length
    ).toBeGreaterThan(0);
  });
});
