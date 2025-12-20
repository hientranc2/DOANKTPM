import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within
} from '@testing-library/react'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import App from '../App'

const sampleProducts = [
  {
    id: 101,
    name: 'Sample Tee',
    image: '/images/sample-tee.png',
    category: 'men',
    new_price: 150000,
    old_price: 200000
  }
]

const sampleOrders = [
  {
    orderId: 1,
    status: 'pending',
    createdAt: '2025-01-01T10:00:00Z',
    total: 150000,
    customer: { name: 'Nam', email: 'nam@test.com' },
    items: [{ productId: 10, name: 'Áo Thun', quantity: 2, price: 75000 }]
  },
  {
    orderId: 2,
    status: 'shipped',
    createdAt: '2025-01-02T12:00:00Z',
    total: 200000,
    customer: { name: 'Lan', email: 'lan@test.com' },
    items: []
  }
]

const sampleUsers = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@clothify.com',
    status: 'active',
    role: 'admin',
    createdAt: '2025-01-01T10:00:00Z'
  },
  {
    id: 2,
    name: 'Customer',
    email: 'customer@test.com',
    status: 'active',
    role: 'customer',
    createdAt: '2025-01-02T10:00:00Z'
  }
]

const buildJsonResponse = (data, ok = true) =>
  Promise.resolve({
    ok,
    json: async () => data
  })

const buildFetchMock = ({
  orders = sampleOrders,
  users = sampleUsers,
  products = sampleProducts,
  uploadSuccess = true,
  addProductSuccess = true
} = {}) =>
  vi.fn((url, options = {}) => {
    if (url.includes('/orders') && (!options.method || options.method === 'GET')) {
      return buildJsonResponse({ success: true, orders })
    }

    if (url.includes('/orders/') && options.method === 'PATCH') {
      const body = JSON.parse(options.body || '{}')
      const orderId = Number(url.split('/').pop())
      const order = orders.find((item) => item.orderId === orderId)
      return buildJsonResponse({ success: true, order: { ...order, status: body.status } })
    }

    if (url.includes('/users') && (!options.method || options.method === 'GET')) {
      return buildJsonResponse({ success: true, users })
    }

    if (url.includes('/users/') && options.method === 'PATCH') {
      return buildJsonResponse({ success: true })
    }

    if (url.includes('/allproducts')) {
      return buildJsonResponse(products)
    }

    if (url.includes('/removeproduct')) {
      return buildJsonResponse({ success: true })
    }

    if (url.includes('/product/') && options.method === 'PUT') {
      return buildJsonResponse({ success: true, product: products[0] })
    }

    if (url.includes('/upload')) {
      return buildJsonResponse({ success: uploadSuccess ? 1 : 0, image_url: 'https://example.com/image.png' })
    }

    if (url.includes('/addproduct')) {
      return buildJsonResponse({ success: addProductSuccess })
    }

    return buildJsonResponse({ success: true })
  })

const renderAdmin = (route = '/') =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  )

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  global.fetch = buildFetchMock()
  window.alert = vi.fn()
  if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = vi.fn(() => 'blob:mock')
  }
})

afterEach(() => {
  vi.resetAllMocks()
})

test('Admin nav: di qua cac trang bang sidebar', async () => {
  renderAdmin('/')

  await screen.findByText('Bảng điều khiển')

  fireEvent.click(screen.getByText('Add Product'))
  expect(await screen.findByText('Product title')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Product List'))
  expect(await screen.findByText('Quản lý sản phẩm')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Order Management'))
  expect(await screen.findByText('Quản lý đơn hàng')).toBeInTheDocument()

  fireEvent.click(screen.getByText('Customer Management'))
  expect(await screen.findByText('Quản lý khách hàng')).toBeInTheDocument()
})

test('Dashboard: load thong ke tu orders va users', async () => {
  renderAdmin('/')

  await screen.findByText('Bảng điều khiển')

  const totalOrdersCard = screen.getByText('Tổng số đơn').closest('.stat-card')
  expect(within(totalOrdersCard).getByText('2')).toBeInTheDocument()

  const needingCard = screen.getByText('Đơn cần xử lý').closest('.stat-card')
  expect(within(needingCard).getByText('1')).toBeInTheDocument()

  expect(screen.getByText('Áo Thun')).toBeInTheDocument()
})

test('Dashboard: hien thi loi khi API fail', async () => {
  global.fetch = vi.fn((url) => {
    if (url.includes('/orders')) {
      return buildJsonResponse({ success: false, message: 'Không thể tải đơn hàng' }, false)
    }
    if (url.includes('/users')) {
      return buildJsonResponse({ success: true, users: [] })
    }
    return buildJsonResponse({ success: true })
  })

  renderAdmin('/')

  expect(await screen.findByText('Không thể tải đơn hàng')).toBeInTheDocument()
})

test('AddProduct: bat buoc chon anh', async () => {
  renderAdmin('/addproduct')

  fireEvent.click(screen.getByRole('button', { name: 'ADD' }))

  expect(window.alert).toHaveBeenCalledWith('Vui lòng chọn ít nhất một ảnh sản phẩm.')
  expect(global.fetch).not.toHaveBeenCalled()
})

test('AddProduct: upload va tao san pham thanh cong', async () => {
  global.fetch = buildFetchMock()
  renderAdmin('/addproduct')

  const [nameInput, oldPriceInput, newPriceInput] = screen.getAllByPlaceholderText('Type here')
  fireEvent.change(nameInput, { target: { value: 'New Product' } })
  fireEvent.change(oldPriceInput, { target: { value: '200000' } })
  fireEvent.change(newPriceInput, { target: { value: '150000' } })

  const fileInput = document.querySelector('#file-input')
  const file = new File(['fake'], 'product.png', { type: 'image/png' })
  fireEvent.change(fileInput, { target: { files: [file] } })

  fireEvent.click(screen.getByRole('button', { name: 'ADD' }))

  await waitFor(() => {
    expect(window.alert).toHaveBeenCalledWith('✅ Product Added')
  })

  const calledUrls = global.fetch.mock.calls.map(([url]) => url)
  expect(calledUrls.some((url) => url.includes('/upload'))).toBe(true)
  expect(calledUrls.some((url) => url.includes('/addproduct'))).toBe(true)
})

test('ListProduct: load danh sach va xoa san pham', async () => {
  let allProductsCalls = 0
  global.fetch = vi.fn((url, options = {}) => {
    if (url.includes('/allproducts')) {
      allProductsCalls += 1
      return buildJsonResponse(allProductsCalls === 1 ? sampleProducts : [])
    }
    if (url.includes('/removeproduct') && options.method === 'POST') {
      return buildJsonResponse({ success: true })
    }
    return buildJsonResponse({ success: true })
  })

  renderAdmin('/listproduct')

  await screen.findByText('Sample Tee')
  fireEvent.click(screen.getByAltText('Xoá sản phẩm'))

  expect(await screen.findByText(/Đã xoá sản phẩm thành công/i)).toBeInTheDocument()
  expect(await screen.findByText(/Chưa có sản phẩm nào/i)).toBeInTheDocument()
})

test('ListProduct: sua san pham va luu thanh cong', async () => {
  global.fetch = vi.fn((url, options = {}) => {
    if (url.includes('/allproducts')) {
      return buildJsonResponse(sampleProducts)
    }
    if (url.includes('/product/101') && options.method === 'PUT') {
      return buildJsonResponse({ success: true, product: sampleProducts[0] })
    }
    return buildJsonResponse({ success: true })
  })

  renderAdmin('/listproduct')

  await screen.findByText('Sample Tee')
  fireEvent.click(screen.getByRole('button', { name: 'Sửa' }))

  const nameInput = screen.getByLabelText('Tên sản phẩm')
  fireEvent.change(nameInput, { target: { value: 'Updated Tee' } })

  fireEvent.click(screen.getByRole('button', { name: /Lưu thay đổi/i }))

  expect(await screen.findByText(/Đã cập nhật sản phẩm thành công/i)).toBeInTheDocument()
})

test('OrderManagement: cap nhat trang thai don hang', async () => {
  global.fetch = buildFetchMock()
  renderAdmin('/ordermanagement')

  await screen.findByText('Đơn #1')

  const selects = screen.getAllByRole('combobox')
  const orderSelect = selects.find((select) => select.value === 'pending')

  fireEvent.change(orderSelect, { target: { value: 'shipped' } })

  expect(await screen.findByText(/Đã cập nhật trạng thái đơn hàng/i)).toBeInTheDocument()
})

test('CustomerManagement: cap nhat role va trang thai', async () => {
  global.fetch = buildFetchMock()
  renderAdmin('/customermanagement')

  const adminRow = await screen.findByText('Admin')
  const adminContainer = adminRow.closest('tr')
  const adminSelect = within(adminContainer).getByRole('combobox')
  const adminButton = within(adminContainer).getByRole('button')
  expect(adminSelect).toBeDisabled()
  expect(adminButton).toBeDisabled()

  const customerRow = screen.getByText('Customer').closest('tr')
  const roleSelect = within(customerRow).getByRole('combobox')
  fireEvent.change(roleSelect, { target: { value: 'admin' } })

  expect(await screen.findByText(/Đã cập nhật vai trò khách hàng/i)).toBeInTheDocument()

  const statusButton = within(customerRow).getByRole('button', { name: 'Khoá' })
  fireEvent.click(statusButton)

  expect(await screen.findByText(/Đã cập nhật trạng thái khách hàng/i)).toBeInTheDocument()
})
