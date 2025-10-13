import React, { useEffect, useState } from 'react'
import './CustomerManagement.css'

const statusDictionary = {
  active: 'Hoạt động',
  suspended: 'Bị khoá'
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchCustomers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:4000/users')
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải khách hàng.')
      }
      const mapped = Array.isArray(data.users)
        ? data.users.map((user) => ({
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt
          }))
        : []
      setCustomers(mapped)
    } catch (err) {
      setError(err.message)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const toggleStatus = async (customer) => {
    const nextStatus = customer.status === 'active' ? 'suspended' : 'active'
    setUpdatingId(customer.id)
    setError('')
    setFeedback('')
    try {
      const response = await fetch(`http://localhost:4000/users/${customer.id}/status`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật trạng thái tài khoản.')
      }
      setFeedback('Đã cập nhật trạng thái khách hàng.')
      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id ? { ...item, status: nextStatus } : item
        )
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className='customer-management'>
      <div className='customer-management-header'>
        <div>
          <h2>Quản lý khách hàng</h2>
          <p>Theo dõi tài khoản đăng ký từ trang người dùng.</p>
        </div>
        <button type='button' onClick={fetchCustomers} disabled={loading}>
          {loading ? 'Đang tải...' : 'Tải lại'}
        </button>
      </div>
      {error && <div className='customer-management-alert error'>{error}</div>}
      {feedback && <div className='customer-management-alert success'>{feedback}</div>}
      <div className='customer-table-wrapper'>
        <table className='customer-table'>
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Email</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className='customer-table-empty'>Đang tải dữ liệu...</td>
              </tr>
            )}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={5} className='customer-table-empty'>Chưa có khách hàng nào.</td>
              </tr>
            )}
            {!loading &&
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleString('vi-VN')
                      : 'Không xác định'}
                  </td>
                  <td>
                    <span className={`customer-status status-${customer.status}`}>
                      {statusDictionary[customer.status] || customer.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type='button'
                      onClick={() => toggleStatus(customer)}
                      disabled={updatingId === customer.id}
                    >
                      {customer.status === 'active' ? 'Khoá' : 'Mở khoá'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default CustomerManagement
