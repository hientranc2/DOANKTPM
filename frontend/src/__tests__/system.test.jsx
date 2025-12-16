import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { renderWithProviders } from '../test-utils/renderWithProviders';

const buildMockResponse = (data) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  });

describe('System test - luồng tải sản phẩm', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('hiển thị lỗi khi gọi API thất bại và cho phép thử lại', async () => {
    const user = userEvent;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const resolvedProducts = [
      {
        id: 901,
        name: 'Áo sơ mi hệ thống',
        category: 'men',
        image: '/images/system-shirt.png',
        new_price: 240000,
        old_price: 320000,
      },
    ];

    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network down'))
      .mockImplementationOnce(() => buildMockResponse(resolvedProducts));

    renderWithProviders(<App />, { withRouter: false });

    const retryButton = await screen.findByRole('button', { name: /Thử lại/i });
    expect(
      screen.getByText(/Không thể tải sản phẩm mới, sử dụng dữ liệu cục bộ/i)
    ).toBeInTheDocument();

    await user.click(retryButton);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    const productTitles = await screen.findAllByText('Áo sơ mi hệ thống');
    expect(productTitles.length).toBeGreaterThan(0);

    await waitFor(() =>
      expect(
        screen.queryByText(/Không thể tải sản phẩm mới, sử dụng dữ liệu cục bộ/i)
      ).not.toBeInTheDocument()
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
