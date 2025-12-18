import { screen } from '@testing-library/react';
import App from './App';
import { renderWithProviders } from './test-utils/renderWithProviders';

test('renders app shell', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  });

  renderWithProviders(<App />, { withRouter: false });

  const brandMarks = await screen.findAllByText('SHOPPER');
  expect(brandMarks.length).toBeGreaterThan(0);
});
