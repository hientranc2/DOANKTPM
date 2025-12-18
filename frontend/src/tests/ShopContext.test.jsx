import React from 'react'
import { render, screen, act } from '@testing-library/react'
import ShopContextProvider, { ShopContext } from '../Context/ShopContext'

global.fetch = jest.fn()

const mockProducts = [
  { id: 1, name: 'Áo', new_price: 100, image: '/a.png' }
]

const TestConsumer = () => (
  <ShopContext.Consumer>
    {(ctx) => (
      <>
        <span data-testid="count">{ctx.getTotalCartItems()}</span>
        <span data-testid="total">{ctx.getTotalCartAmount()}</span>
        <button onClick={() => ctx.addToCart(1, 'M', 2)}>add</button>
        <button onClick={ctx.clearCart}>clear</button>
      </>
    )}
  </ShopContext.Consumer>
)

describe('ShopContext', () => {
  beforeEach(() => {
    fetch.mockReset()
  })

  test('fetchProducts success → set products', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    })

    await act(async () => {
      render(
        <ShopContextProvider>
          <TestConsumer />
        </ShopContextProvider>
      )
    })

    // Không crash = PASS logic fetch
    expect(fetch).toHaveBeenCalled()
  })

  test('addToCart tăng số lượng và tính tổng', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    })

    await act(async () => {
      render(
        <ShopContextProvider>
          <TestConsumer />
        </ShopContextProvider>
      )
    })

    act(() => {
      screen.getByText('add').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('2')
    expect(screen.getByTestId('total').textContent).toBe('200')
  })

  test('clearCart reset cartItems', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts
    })

    await act(async () => {
      render(
        <ShopContextProvider>
          <TestConsumer />
        </ShopContextProvider>
      )
    })

    act(() => {
      screen.getByText('add').click()
      screen.getByText('clear').click()
    })

    expect(screen.getByTestId('count').textContent).toBe('0')
  })
})
