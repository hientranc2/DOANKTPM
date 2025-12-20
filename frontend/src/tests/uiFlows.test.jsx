import React, { useContext, useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Shop from '../Pages/Shop'
import Checkout from '../Pages/Checkout'
import { ShopContext } from '../Context/ShopContext'
import ShopContextProvider from '../Context/ShopContext'
import AuthProvider from '../Context/AuthContext'
import { MemoryRouter } from 'react-router-dom'

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
    .mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    })
    .mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, order: { orderId: 1, items: [], total: 100000 } }),
    })
}

const renderWithProviders = (ui) =>
  render(
    <AuthProvider>
      <ShopContextProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </ShopContextProvider>
    </AuthProvider>
  )

describe('Frontend flows (UI)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockFetch()
  })

  test('Render Home OK', async () => {
    renderWithProviders(<Shop />)
    expect(await screen.findByText(/Bán chạy của phụ nữ/i)).toBeInTheDocument()
  })

  test('Item link points to detail route', async () => {
    renderWithProviders(<Shop />)
    const links = await screen.findAllByRole('link')
    expect(links[0].getAttribute('href')).toContain('/product/1')
  })

  test('Add to cart increases count (context)', async () => {
    const CartProbe = () => {
      const { addToCart, getTotalCartItems, products } = useContext(ShopContext)
      return (
        <>
          <button
            type='button'
            onClick={() => products.length && addToCart(products[0].id, 'M')}
          >
            add-one
          </button>
          <div data-testid='cart-count'>{getTotalCartItems()}</div>
        </>
      )
    }

    renderWithProviders(<CartProbe />)
    await userEvent.click(screen.getByText('add-one'))
    expect(await screen.findByTestId('cart-count')).toHaveTextContent('1')
  })

  test('Checkout form validation when cart empty', async () => {
    renderWithProviders(<Checkout />)
    expect(await screen.findByText(/Giỏ hàng của bạn đang trống/i)).toBeInTheDocument()
  })
})
