// src/tests/Checkout.test.jsx
import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import Checkout from '../Pages/Checkout';
import { ShopContext } from '../Context/ShopContext';
import { AuthContext } from '../Context/AuthContext';

const renderCheckout = ({
  cartItemsOverride,
  productsOverride,
  userOverride,
} = {}) => {
  const defaultProducts = [
    {
      id: 1,
      name: 'Áo thun test',
      new_price: 50000,
    },
  ];

  const defaultCartItems = {
    '1-default': 2, // 2 cái áo
  };

  const shopValue = {
    products: productsOverride || defaultProducts,
    cartItems: cartItemsOverride || defaultCartItems,
    clearCart: jest.fn(),
  };

  const authValue = {
    user:
      userOverride || {
        name: 'Test User',
        email: 'test@example.com',
      },
  };

  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <ShopContext.Provider value={shopValue}>
          <Checkout />
        </ShopContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('Checkout page – unit tests', () => {
  beforeEach(() => {
    // mock fetch nếu cần
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('formatCurrency: tổng tiền hiển thị đúng định dạng VND', () => {
    renderCheckout();

    // 2 * 50.000 = 100.000
    expect(screen.getByText(/Tổng cộng:/i)).toBeInTheDocument();
    expect(screen.getByText('100.000đ')).toBeInTheDocument();
  });

  test('handleInputChange: cardNumber chỉ nhận số, giới hạn, tự format', () => {
    renderCheckout();

    // Chọn phương thức thanh toán bằng thẻ
    const paymentSelect = screen.getByLabelText(
      /Phương thức thanh toán/i
    );
    fireEvent.change(paymentSelect, {
      target: { value: 'credit_card' },
    });

    const cardInput = screen.getByLabelText(/Số thẻ/i);

    // Nhập chuỗi có cả chữ, ký tự đặc biệt và nhiều số
    fireEvent.change(cardInput, {
      target: {
        value: '1234abcd5678!@#9012 3456 7890',
      },
    });

    // Trong code: lấy max 19 digits rồi group 4 số
    expect(cardInput.value).toBe('1234 5678 9012 3456 789');
  });

  test('handleInputChange: expiryMonth / expiryYear / cvv giới hạn số', () => {
    renderCheckout();

    const paymentSelect = screen.getByLabelText(
      /Phương thức thanh toán/i
    );
    fireEvent.change(paymentSelect, {
      target: { value: 'credit_card' },
    });

    const monthInput = screen.getByLabelText(
      /Tháng hết hạn/i
    );
    const yearInput = screen.getByLabelText(/Năm hết hạn/i);
    const cvvInput = screen.getByLabelText(/CVV/i);

    fireEvent.change(monthInput, {
      target: { value: '1234' },
    });
    fireEvent.change(yearInput, {
      target: { value: '20252026' },
    });
    fireEvent.change(cvvInput, {
      target: { value: '12345' },
    });

    expect(monthInput.value).toBe('12'); // max 2 ký tự
    expect(yearInput.value).toBe('2025'); // max 4 ký tự
    expect(cvvInput.value).toBe('1234'); // max 4 ký tự
  });

  test('handlePaymentMethodChange: đổi qua lại giữa credit_card và COD, cardNumber bị reset', () => {
    renderCheckout();

    const paymentSelect = screen.getByLabelText(
      /Phương thức thanh toán/i
    );

    // Bật chế độ thẻ
    fireEvent.change(paymentSelect, {
      target: { value: 'credit_card' },
    });

    let cardInput = screen.getByLabelText(/Số thẻ/i);
    fireEvent.change(cardInput, {
      target: { value: '1234 5678' },
    });
    expect(cardInput.value).toBe('1234 5678');

    // Chuyển về thanh toán khi nhận hàng → reset các field thẻ
    fireEvent.change(paymentSelect, {
      target: { value: 'cash_on_delivery' },
    });

    // Chuyển lại về credit card
    fireEvent.change(paymentSelect, {
      target: { value: 'credit_card' },
    });

    cardInput = screen.getByLabelText(/Số thẻ/i);
    expect(cardInput.value).toBe(''); // đã bị reset
  });

  test('handleSubmit: thiếu địa chỉ → hiển thị lỗi và không gọi API', () => {
    // user đã có name + email, address vẫn rỗng
    renderCheckout();

    const submitButton = screen.getByRole('button', {
      name: /Đặt hàng/i,
    });

    fireEvent.click(submitButton);

    expect(
      screen.getByText(
        /Vui lòng điền đầy đủ họ tên, email và địa chỉ giao hàng\./i
      )
    ).toBeInTheDocument();

    // Không gọi fetch vì validate fail
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
