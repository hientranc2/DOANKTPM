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

    const [titleInput, priceInput, offerInput] = screen.getAllByPlaceholderText(/Type here/i)
    fireEvent.change(titleInput, { target: { value: 'New Product' } })
    fireEvent.change(priceInput, { target: { value: '150000' } })
    fireEvent.change(offerInput, { target: { value: '120000' } })

    const fileInput = document.querySelector('#file-input')
    fireEvent.change(fileInput, { target: { files: [file] } })

    const submit = screen.getByRole('button', { name: /ADD/i })
    fireEvent.click(submit)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
