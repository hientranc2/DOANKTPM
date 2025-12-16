import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { renderWithProviders } from '../test-utils/renderWithProviders';

const mockProduct = {
  id: 777,
  name: 'Áo thun acceptance',
  category: 'women',
  image: '/images/acceptance-shirt.png',
  new_price: 250000,
  old_price: 300000,
};

describe('Acceptance test - hành trình thêm giỏ và thanh toán', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
    jest.clearAllMocks();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockProduct],
    });
  });

  test('người dùng chọn size, thêm vào giỏ, xem giỏ và được nhắc đăng nhập khi thanh toán', async () => {
    const user = userEvent;
    renderWithProviders(<App />, {
      route: `/product/${mockProduct.id}`,
      withRouter: false,
    });

    await screen.findByText(mockProduct.name);

    await user.click(screen.getByRole('button', { name: 'M' }));
    await user.click(screen.getByRole('button', { name: 'Tăng số lượng' }));

    await user.click(screen.getByRole('button', { name: /THÊM VÀO GIỎ/i }));

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/Kích thước: M/)).toBeInTheDocument();
    expect(screen.getByText(/Số lượng: 2/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Xem giỏ hàng/i }));

    await screen.findByText(mockProduct.name);
    const totals = screen.getAllByText('500.000đ');
    expect(totals.length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /TIẾN HÀNH THANH TOÁN/i }));
    expect(
      await screen.findByText(/Vui lòng đăng nhập để có thể thanh toán/i)
    ).toBeInTheDocument();
  });
});
