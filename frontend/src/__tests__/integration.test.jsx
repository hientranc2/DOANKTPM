import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { renderWithProviders } from '../test-utils/renderWithProviders';

const baseProducts = [
  {
    id: 101,
    name: 'Basic Tee',
    category: 'men',
    image: '/images/basic-tee.png',
    new_price: 150000,
    old_price: 200000,
    date: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 102,
    name: 'Summer Dress',
    category: 'women',
    image: '/images/summer-dress.png',
    new_price: 250000,
    old_price: 300000,
    date: '2024-02-01T00:00:00.000Z',
  },
  {
    id: 103,
    name: 'Kid Hoodie',
    category: 'kid',
    image: '/images/kid-hoodie.png',
    new_price: 180000,
    old_price: 210000,
    date: '2024-03-01T00:00:00.000Z',
  },
  {
    id: 104,
    name: 'Men Jacket',
    category: 'men',
    image: '/images/men-jacket.png',
    new_price: 350000,
    old_price: 400000,
    date: '2024-04-01T00:00:00.000Z',
  },
];

const defaultUser = {
  id: 5001,
  name: 'Test User',
  email: 'test.user@mail.com',
  role: 'customer',
};

const buildJsonResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data,
  });

const buildFetchMock = ({
  products = baseProducts,
  registerResponse = { success: true, token: 'token-1', user: defaultUser },
  registerOk = true,
  loginResponse = { success: true, token: 'token-2', user: defaultUser },
  loginOk = true,
  ordersResponse = {
    success: true,
    order: {
      orderId: 7001,
      items: [
        {
          productId: baseProducts[0].id,
          name: baseProducts[0].name,
          quantity: 1,
          price: baseProducts[0].new_price,
        },
      ],
      total: baseProducts[0].new_price,
    },
  },
  ordersOk = true,
} = {}) =>
  jest.fn((url, options = {}) => {
    const target = typeof url === 'string' ? url : url?.url || '';

    if (target.includes('/allproducts')) {
      return buildJsonResponse(products, true);
    }

    if (target.includes('/register')) {
      return buildJsonResponse(registerResponse, registerOk);
    }

    if (target.includes('/login')) {
      return buildJsonResponse(loginResponse, loginOk);
    }

    if (target.includes('/orders') && (!options.method || options.method === 'POST')) {
      return buildJsonResponse(ordersResponse, ordersOk);
    }

    return buildJsonResponse({ success: true }, true);
  });

const renderApp = ({ route = '/', fetchMock } = {}) => {
  global.fetch = fetchMock || buildFetchMock();
  renderWithProviders(<App />, { route, withRouter: false });
  return userEvent;
};

const setAuthStorage = (user = defaultUser) => {
  localStorage.setItem('auth_token', 'token-test');
  localStorage.setItem('auth_user', JSON.stringify(user));
};

const addItemToCart = async (user) => {
  await screen.findByText(baseProducts[0].name);
  await user.click(screen.getByRole('button', { name: 'M' }));
  await user.click(screen.getByRole('button', { name: /THÊM VÀO GIỎ/i }));
  await screen.findByRole('alertdialog');
};

beforeEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
  jest.clearAllMocks();
  window.scrollTo = jest.fn();
});

test('FE-IT-01 render trang chu co navbar va footer', async () => {
  renderApp();

  await screen.findByText(/Bản quyền/i);

  const brandMarks = screen.getAllByText('SHOPPER');
  expect(brandMarks.length).toBeGreaterThanOrEqual(2);
  expect(screen.getByText(/Bản quyền/i)).toBeInTheDocument();
});

test('FE-IT-02 load danh sach san pham tu API', async () => {
  renderApp();

  const items = await screen.findAllByText(baseProducts[0].name);
  expect(items.length).toBeGreaterThan(0);
});

test('FE-IT-03 hien thi loi khi load san pham that bai', async () => {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network down'));
  renderWithProviders(<App />, { route: '/', withRouter: false });

  expect(
    await screen.findByText(/Không thể tải sản phẩm mới, sử dụng dữ liệu cục bộ/i)
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Thử lại/i })).toBeInTheDocument();
});

test('FE-IT-04 thu lai khi load san pham that bai', async () => {
  global.fetch = jest
    .fn()
    .mockRejectedValueOnce(new Error('Network down'))
    .mockResolvedValueOnce({
      ok: true,
      json: async () => baseProducts,
    });

  renderWithProviders(<App />, { route: '/', withRouter: false });

  const retryButton = await screen.findByRole('button', { name: /Thử lại/i });
  await userEvent.click(retryButton);

  const items = await screen.findAllByText(baseProducts[0].name);
  expect(items.length).toBeGreaterThan(0);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('FE-IT-05 loc danh sach theo danh muc', async () => {
  renderApp({ route: '/mens' });

  await screen.findByText('Basic Tee');
  expect(screen.queryByText('Summer Dress')).not.toBeInTheDocument();
  expect(screen.getByText('Men Jacket')).toBeInTheDocument();
});

test('FE-IT-06 loc gia duoi 200k', async () => {
  const user = renderApp({ route: '/mens' });

  await screen.findByText('Basic Tee');
  await user.click(screen.getByLabelText(/Dưới 200\.000đ/i));

  await waitFor(() => {
    expect(screen.queryByText('Men Jacket')).not.toBeInTheDocument();
  });
  expect(screen.getByText('Basic Tee')).toBeInTheDocument();
});

test('FE-IT-07 search theo query param', async () => {
  renderApp({ route: '/search?query=basic' });

  await screen.findByText('Basic Tee');
  expect(screen.queryByText('Summer Dress')).not.toBeInTheDocument();
});

test('FE-IT-08 hien thi goi y tim kiem', async () => {
  const user = renderApp();

  await screen.findAllByText('Basic Tee');

  const searchInput = screen.getByPlaceholderText(/Tìm sản phẩm/i);
  await user.type(searchInput, 'Basic');

  expect(await screen.findByText(/Gợi ý nhanh/i)).toBeInTheDocument();
});

test('FE-IT-09 chon goi y -> mo trang chi tiet', async () => {
  const user = renderApp();

  await screen.findAllByText('Basic Tee');

  const searchInput = screen.getByPlaceholderText(/Tìm sản phẩm/i);
  await user.type(searchInput, 'Basic');

  const suggestionsTitle = await screen.findByText(/Gợi ý nhanh/i);
  const suggestionsBox = suggestionsTitle.closest('.nav-search-suggestions');
  const suggestionItem = within(suggestionsBox).getByText('Basic Tee');

  await user.click(suggestionItem);

  expect(await screen.findByText(/Chọn kích thước/i)).toBeInTheDocument();
});

test('FE-IT-10 product id khong ton tai', async () => {
  renderApp({ route: '/product/999999' });

  expect(await screen.findByText(/Không tìm thấy sản phẩm/i)).toBeInTheDocument();
});

test('FE-IT-11 them gio hang khi chua chon size', async () => {
  const user = renderApp({ route: `/product/${baseProducts[0].id}` });

  await screen.findByText(baseProducts[0].name);

  await user.click(screen.getByRole('button', { name: /THÊM VÀO GIỎ/i }));

  expect(
    await screen.findByText(/Vui lòng chọn kích thước/i)
  ).toBeInTheDocument();
});

test('FE-IT-12 them gio hang thanh cong', async () => {
  const user = renderApp({ route: `/product/${baseProducts[0].id}` });

  await addItemToCart(user);

  expect(await screen.findByText(/Thêm vào giỏ hàng thành công/i)).toBeInTheDocument();
});

test('FE-IT-13 cap nhat so luong tren navbar', async () => {
  const user = renderApp({ route: `/product/${baseProducts[0].id}` });

  await addItemToCart(user);

  const cartCount = document.querySelector('.nav-cart-count');
  expect(cartCount).toHaveTextContent('1');
});

test('FE-IT-14 gio hang hien thi san pham va tong tien', async () => {
  const user = renderApp({ route: `/product/${baseProducts[0].id}` });

  await addItemToCart(user);
  await user.click(screen.getByRole('button', { name: /Xem giỏ hàng/i }));

  await screen.findByText(baseProducts[0].name);
  const totals = screen.getAllByText('150.000đ');
  expect(totals.length).toBeGreaterThan(0);
});

test('FE-IT-15 xoa san pham khoi gio hang', async () => {
  const user = renderApp({ route: `/product/${baseProducts[0].id}` });

  await addItemToCart(user);
  await user.click(screen.getByRole('button', { name: /Xem giỏ hàng/i }));

  await screen.findByText(baseProducts[0].name);
  await user.click(screen.getByAltText(/Xoá khỏi giỏ/i));

  expect(await screen.findByText(/Giỏ hàng của bạn đang trống/i)).toBeInTheDocument();
});

test('FE-IT-16 can dang nhap de thanh toan', async () => {
  const user = renderApp({ route: `/product/${baseProducts[0].id}` });

  await addItemToCart(user);
  await user.click(screen.getByRole('button', { name: /Xem giỏ hàng/i }));

  const checkoutButton = await screen.findByRole('button', { name: /TIẾN HÀNH THANH TOÁN/i });
  await user.click(checkoutButton);

  expect(
    await screen.findByText(/Vui lòng đăng nhập để có thể thanh toán/i)
  ).toBeInTheDocument();
});

test('FE-IT-17 toggle login va signup', async () => {
  renderApp({ route: '/login' });

  expect(await screen.findByRole('heading', { name: /Đăng ký/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Họ và tên/i)).toBeInTheDocument();

  await userEvent.click(screen.getByText(/Đăng nhập ngay/i));

  expect(await screen.findByRole('heading', { name: /Đăng nhập/i })).toBeInTheDocument();
  expect(screen.queryByPlaceholderText(/Họ và tên/i)).not.toBeInTheDocument();
});

test('FE-IT-18 dang ky thanh cong', async () => {
  global.fetch = buildFetchMock();
  renderWithProviders(<App />, { route: '/login', withRouter: false });

  await screen.findByRole('heading', { name: /Đăng ký/i });

  await userEvent.type(screen.getByPlaceholderText(/Họ và tên/i), 'New User');
  await userEvent.type(screen.getByPlaceholderText(/Địa chỉ email/i), 'new@mail.com');
  await userEvent.type(screen.getByPlaceholderText(/Mật khẩu/i), '123456');

  await userEvent.click(screen.getByRole('button', { name: /Tiếp tục/i }));

  expect(
    await screen.findByText(/Đăng ký thành công/i)
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Đăng nhập/i })).toBeInTheDocument();
});

test('FE-IT-19 dang nhap thanh cong', async () => {
  const loginResponse = {
    success: true,
    token: 'token-login',
    user: { ...defaultUser, name: 'Login User' },
  };

  global.fetch = buildFetchMock({ loginResponse });
  renderWithProviders(<App />, { route: '/login', withRouter: false });

  await screen.findByRole('heading', { name: /Đăng ký/i });
  await userEvent.click(screen.getByText(/Đăng nhập ngay/i));

  await userEvent.type(screen.getByPlaceholderText(/Địa chỉ email/i), loginResponse.user.email);
  await userEvent.type(screen.getByPlaceholderText(/Mật khẩu/i), '123456');
  await userEvent.click(screen.getByRole('button', { name: /Đăng nhập/i }));

  expect(await screen.findByText(/Xin chào, Login User/i)).toBeInTheDocument();
  expect(localStorage.getItem('auth_token')).toBe('token-login');
});

test('FE-IT-20 checkout thieu dia chi', async () => {
  setAuthStorage();
  const user = renderApp({ route: `/product/${baseProducts[0].id}` });

  await screen.findByText(/Xin chào, Test User/i);
  await addItemToCart(user);
  await user.click(screen.getByRole('button', { name: /Xem giỏ hàng/i }));

  const checkoutButton = await screen.findByRole('button', { name: /TIẾN HÀNH THANH TOÁN/i });
  await user.click(checkoutButton);

  await screen.findByRole('heading', { name: /^Thanh toán$/i });
  await user.click(screen.getByRole('button', { name: /Đặt hàng/i }));

  expect(
    await screen.findByText(/Vui lòng điền đầy đủ họ tên, email và địa chỉ/i)
  ).toBeInTheDocument();
});

test('FE-IT-21 thanh toan the thieu thong tin', async () => {
  setAuthStorage();
  const user = renderApp({ route: `/product/${baseProducts[0].id}` });

  await screen.findByText(/Xin chào, Test User/i);
  await addItemToCart(user);
  await user.click(screen.getByRole('button', { name: /Xem giỏ hàng/i }));

  const checkoutButton = await screen.findByRole('button', { name: /TIẾN HÀNH THANH TOÁN/i });
  await user.click(checkoutButton);

  await screen.findByRole('heading', { name: /^Thanh toán$/i });
  await user.type(screen.getByLabelText(/Địa chỉ giao hàng/i), '123 Street');

  const paymentSelect = screen.getByLabelText(/Phương thức thanh toán/i);
  fireEvent.change(paymentSelect, { target: { value: 'credit_card' } });

  await user.click(screen.getByRole('button', { name: /Thanh toán/i }));

  expect(
    await screen.findByText(/Vui lòng nhập đầy đủ thông tin thẻ thanh toán/i)
  ).toBeInTheDocument();
});

test('FE-IT-22 checkout thanh cong', async () => {
  setAuthStorage();
  const ordersResponse = {
    success: true,
    order: {
      orderId: 4321,
      items: [
        {
          productId: baseProducts[0].id,
          name: baseProducts[0].name,
          quantity: 1,
          price: baseProducts[0].new_price,
        },
      ],
      total: baseProducts[0].new_price,
    },
  };

  const user = renderApp({
    route: `/product/${baseProducts[0].id}`,
    fetchMock: buildFetchMock({ ordersResponse }),
  });

  await screen.findByText(/Xin chào, Test User/i);
  await addItemToCart(user);
  await user.click(screen.getByRole('button', { name: /Xem giỏ hàng/i }));

  const checkoutButton = await screen.findByRole('button', { name: /TIẾN HÀNH THANH TOÁN/i });
  await user.click(checkoutButton);

  await screen.findByRole('heading', { name: /^Thanh toán$/i });
  await user.type(screen.getByLabelText(/Địa chỉ giao hàng/i), '456 Street');
  await user.click(screen.getByRole('button', { name: /Đặt hàng/i }));

  expect(await screen.findByText(/Đặt hàng thành công/i)).toBeInTheDocument();
  expect(screen.getByText('#4321')).toBeInTheDocument();
});
