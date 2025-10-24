import React, { useContext, useState } from 'react'
import './CSS/LoginSignup.css'
import { API_BASE_URL } from '../config'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../Context/AuthContext'

const LoginSignup = () => {
  const [mode, setMode] = useState('signup')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()
  const { login: authenticate } = useContext(AuthContext)

  const toggleMode = () => {
    setMode((prev) => (prev === 'signup' ? 'login' : 'signup'))
    setError('')
    setSuccess('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const endpoint = mode === 'signup' ? 'register' : 'login'
      const payload = {
        email: form.email,
        password: form.password
      }
      if (mode === 'signup') {
        payload.name = form.name
      }

      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể xử lý yêu cầu.')
      }

      if (mode === 'signup') {
        setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.')
        setForm({ name: '', email: '', password: '' })
        setMode('login')
      } else if (data.token && data.user) {
        authenticate(data.token, data.user)
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='loginsignup'>
      <div className='loginsignup-container'>
        <h1>{mode === 'signup' ? 'Đăng ký' : 'Đăng nhập'}</h1>
        <form className='loginsignup-fields' onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type='text'
              name='name'
              placeholder='Họ và tên'
              value={form.name}
              onChange={handleChange}
              required
            />
          )}
          <input
            type='email'
            name='email'
            placeholder='Địa chỉ email'
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type='password'
            name='password'
            placeholder='Mật khẩu'
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type='submit' disabled={loading}>
            {loading ? 'Đang xử lý...' : mode === 'signup' ? 'Tiếp tục' : 'Đăng nhập'}
          </button>
        </form>
        {error && <p className='loginsignup-message error'>{error}</p>}
        {success && <p className='loginsignup-message success'>{success}</p>}
        <p className='loginsignup-login'>
          {mode === 'signup'
            ? 'Đã có tài khoản?'
            : 'Chưa có tài khoản?'}{' '}
          <span onClick={toggleMode}>
            {mode === 'signup' ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
          </span>
        </p>
        <div className='loginsignup-agree'>
          <input type='checkbox' name='' id='' />
          <p>
            Bằng cách tiếp tục, tôi đồng ý với điều khoản sử dụng và chính sách
            bảo mật
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginSignup
