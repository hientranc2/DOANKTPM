import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ShopCategory from '../Pages/ShopCategory'
import { ShopContext } from '../Context/ShopContext'

// Mock Item để đơn giản hoá
jest.mock('../Components/Item/Item', () => (props) => {
  return <div>{props.name}</div>
})

const baseContext = {
  loadingProducts: false,
  searchTerm: '',
  products: []
}

const renderWithContext = (ctxOverrides = {}) =>
  render(
    <MemoryRouter>
      <ShopContext.Provider value={{ ...baseContext, ...ctxOverrides }}>
        <ShopCategory category="men" />
      </ShopContext.Provider>
    </MemoryRouter>
  )

describe('ShopCategory', () => {
  test('hiển thị sản phẩm đúng category', () => {
    renderWithContext({
      products: [
        { id: 1, name: 'Áo A', new_price: 100000, category: 'men', image: '' },
        { id: 2, name: 'Áo B', new_price: 300000, category: 'men', image: '' },
        { id: 3, name: 'Váy C', new_price: 500000, category: 'women', image: '' }
      ]
    })

    expect(screen.getByText('Áo A')).toBeInTheDocument()
    expect(screen.getByText('Áo B')).toBeInTheDocument()
    expect(screen.queryByText('Váy C')).not.toBeInTheDocument()
  })

  test('lọc theo khoảng giá under-200', () => {
    renderWithContext({
      products: [
        { id: 1, name: 'Áo A', new_price: 100000, category: 'men', image: '' },
        { id: 2, name: 'Áo B', new_price: 300000, category: 'men', image: '' }
      ]
    })

    fireEvent.click(screen.getByLabelText('Dưới 200.000đ'))

    expect(screen.getByText('Áo A')).toBeInTheDocument()
    expect(screen.queryByText('Áo B')).not.toBeInTheDocument()
  })

  test('sắp xếp giá tăng dần', () => {
    renderWithContext({
      products: [
        { id: 1, name: 'Áo B', new_price: 300000, category: 'men', image: '' },
        { id: 2, name: 'Áo A', new_price: 100000, category: 'men', image: '' }
      ]
    })

    fireEvent.change(screen.getByDisplayValue('Mặc định'), {
      target: { value: 'price-asc' }
    })

    const items = screen.getAllByText(/Áo/)
    expect(items[0]).toHaveTextContent('Áo A')
    expect(items[1]).toHaveTextContent('Áo B')
  })

  test('pagination: chuyển sang trang 2', () => {
    renderWithContext({
      products: Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `SP ${i + 1}`,
        new_price: 100000,
        category: 'men',
        image: ''
      }))
    })

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(screen.getByText('SP 11')).toBeInTheDocument()
    expect(screen.queryByText('SP 1')).not.toBeInTheDocument()
  })
})
