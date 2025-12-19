import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AddProduct from '../Components/AddProduct/AddProduct'
import { MemoryRouter } from 'react-router-dom'

describe('Admin flows', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('Add product form submits and calls APIs', async () => {
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })

    const fetchMock = vi.fn()
      // upload
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: 1, image_url: 'https://example.com/test.png' })
      })
      // addproduct
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, product: { id: 1 } })
      })

    global.fetch = fetchMock
    global.alert = vi.fn()

    render(
      <MemoryRouter>
        <AddProduct />
      </MemoryRouter>
    )

    const nameInput = screen.getByPlaceholderText(/Type here/i)
    fireEvent.change(nameInput, { target: { value: 'New Product' } })

    const oldPrice = screen.getByPlaceholderText(/Price/i)
    fireEvent.change(oldPrice, { target: { value: '150000' } })

    const newPrice = screen.getByPlaceholderText(/Offer Price/i)
    fireEvent.change(newPrice, { target: { value: '120000' } })

    const fileInput = screen.getByLabelText(/Product Category/i).parentElement?.querySelector('#file-input') ||
      document.querySelector('#file-input')
    fireEvent.change(fileInput, { target: { files: [file] } })

    const submit = screen.getByRole('button', { name: /ADD/i })
    fireEvent.click(submit)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
