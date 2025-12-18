import React from 'react'
import { render, screen, act } from '@testing-library/react'
import AuthProvider, { AuthContext } from '../Context/AuthContext'

const TestConsumer = () => (
  <AuthContext.Consumer>
    {(value) => (
      <>
        <span data-testid="token">{value.token}</span>
        <span data-testid="user">{value.user?.name || ''}</span>
        <span data-testid="auth">
          {value.isAuthenticated ? 'yes' : 'no'}
        </span>
        <button onClick={() => value.login('t1', { name: 'A' })}>
          login
        </button>
        <button onClick={value.logout}>logout</button>
      </>
    )}
  </AuthContext.Consumer>
)

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('login set state và localStorage', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    act(() => {
      screen.getByText('login').click()
    })

    expect(screen.getByTestId('token').textContent).toBe('t1')
    expect(screen.getByTestId('user').textContent).toBe('A')
    expect(screen.getByTestId('auth').textContent).toBe('yes')

    expect(localStorage.getItem('auth_token')).toBe('t1')
    expect(JSON.parse(localStorage.getItem('auth_user')).name).toBe('A')
  })

  test('logout clear state và localStorage', () => {
    localStorage.setItem('auth_token', 't1')
    localStorage.setItem('auth_user', JSON.stringify({ name: 'A' }))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    act(() => {
      screen.getByText('logout').click()
    })

    expect(screen.getByTestId('token').textContent).toBe('')
    expect(screen.getByTestId('user').textContent).toBe('')
    expect(screen.getByTestId('auth').textContent).toBe('no')

    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
  })
})
