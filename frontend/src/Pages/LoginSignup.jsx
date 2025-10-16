import React, { useState } from 'react'
import './CSS/LoginSignup.css'
import { API_BASE_URL } from '../config'

const LoginSignup = () => {
  const [mode, setMode] = useState('signup')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

      if (data.token) {
        localStorage.setItem('auth_token', data.token)
      }
      setSuccess(
        mode === 'signup'
          ? 'Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.'
          : 'Đăng nhập thành công!'
      )
      if (mode === 'signup') {
        setForm({ name: '', email: '', password: '' })
        setMode('login')
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
        <h1>{mode === 'signup' ? 'Sign Up' : 'Login'}</h1>
        <form className='loginsignup-fields' onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <input
              type='text'
              name='name'
              placeholder='Your Name'
              value={form.name}
              onChange={handleChange}
              required
            />
          )}
          <input
            type='email'
            name='email'
            placeholder='Email Address'
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type='password'
            name='password'
            placeholder='Password'
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type='submit' disabled={loading}>
            {loading ? 'Processing...' : mode === 'signup' ? 'Continue' : 'Login'}
          </button>
        </form>
        {error && <p className='loginsignup-message error'>{error}</p>}
        {success && <p className='loginsignup-message success'>{success}</p>}
        <p className='loginsignup-login'>
          {mode === 'signup' ? 'Already have an account?' : "Chưa có tài khoản?"}{' '}
          <span onClick={toggleMode}>{mode === 'signup' ? 'Login here' : 'Đăng ký ngay'}</span>
        </p>
        <div className='loginsignup-agree'>
          <input type='checkbox' name='' id='' />
          <p>By continuing, I agree to the terms of use & privacy policy</p>
        </div>
      </div>
    </div>
  )
}

export default LoginSignup
