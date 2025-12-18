import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginSignup from '../Pages/LoginSignup'
import { AuthContext } from '../Context/AuthContext'

const mockLogin = jest.fn()
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

global.fetch = jest.fn()

const renderWithContext = () =>
  render(
    <AuthContext.Provider value={{ login: mockLogin }}>
      <BrowserRouter>
        <LoginSignup />
      </BrowserRouter>
    </AuthContext.Provider>
  )

describe('LoginSignup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('toggleMode: signup → login', () => {
    renderWithContext()

    expect(screen.getByText('Đăng ký')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Đăng nhập ngay'))

    expect(
  screen.getByRole('heading', { name: 'Đăng nhập' })
).toBeInTheDocument()
  })

  test('handleChange: cập nhật email và password', () => {
    renderWithContext()

    fireEvent.change(screen.getByPlaceholderText('Địa chỉ email'), {
      target: { value: 'test@mail.com' }
    })

    fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), {
      target: { value: '123456' }
    })

    expect(screen.getByDisplayValue('test@mail.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('123456')).toBeInTheDocument()
  })

  test('submit login thành công → gọi authenticate + navigate("/")', async () => {
    renderWithContext()

    // chuyển sang login
    fireEvent.click(screen.getByText('Đăng nhập ngay'))

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        token: 'token123',
        user: { name: 'User A', role: 'user' }
      })
    })

    fireEvent.change(screen.getByPlaceholderText('Địa chỉ email'), {
      target: { value: 'user@mail.com' }
    })

    fireEvent.change(screen.getByPlaceholderText('Mật khẩu'), {
      target: { value: '123456' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'token123',
        { name: 'User A', role: 'user' }
      )
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  test('submit login lỗi → hiển thị error', async () => {
    renderWithContext()

    fireEvent.click(screen.getByText('Đăng nhập ngay'))

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: 'Sai mật khẩu'
      })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(screen.getByText('Sai mật khẩu')).toBeInTheDocument()
    })
  })
})
