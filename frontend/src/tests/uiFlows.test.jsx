import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { MemoryRouter } from 'react-router-dom'

// Mock fetch globally
const mockProducts = [
  {
    id: 1,
    name: 'Áo sơ mi',
    image: '/images/p1.png',
    images: ['/images/p1.png'],
    category: 'men',
    new_price: 100000,
    old_price: 150000,
  },
]

const mockFetch = () => {
  global.fetch = jest.fn()
    // first call: products
    .mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    })
    // orders checkout post
    .mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, order: { orderId: 1, items: [], total: 100000 } }),
    })
}

const renderApp = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  )

describe('Frontend flows (UI)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockFetch()
  })

  test('Render Home OK', async () => {
    renderApp('/')
    expect(await screen.findByText(/Bán chạy của phụ nữ/i)).toBeInTheDocument()
  })

  test('Click product → into detail', async () => {
    renderApp('/')
    const productLink = await screen.findByRole('link', { name: /Áo sơ mi/i })
    await userEvent.click(productLink)
    await waitFor(() => {
      expect(window.location.pathname).toContain('/product/1')
    })
  })

  test('Add to cart → count increases', async () => {
    renderApp('/')
    const productLink = await screen.findByRole('link', { name: /Áo sơ mi/i })
    await userEvent.click(productLink)

    const sizeBtn = await screen.findByRole('button', { name: 'M' })
    await userEvent.click(sizeBtn)

    const addBtn = screen.getByRole('button', { name: /THÊM VÀO GIỎ/i })
    await userEvent.click(addBtn)

    // after add, cart count badge shows 1
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  test('Checkout form validation (missing fields)', async () => {
    renderApp('/checkout')
    // ensure products fetched and cart empty
    const submit = screen.getByRole('button', { name: /THANH TOÁN/i })
    await userEvent.click(submit)
    expect(
      await screen.findByText(/Giỏ hàng của bạn đang trống/i)
    ).toBeInTheDocument()
  })
})
