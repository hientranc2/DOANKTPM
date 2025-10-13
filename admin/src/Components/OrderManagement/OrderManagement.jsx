import React, { useCallback, useEffect, useState } from 'react'
import './OrderManagement.css'
import CustomerManagement from '../CustomerManagement/CustomerManagement'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đã giao' }
]

const statusLabel = (value) => {
  const match = STATUS_OPTIONS.find((option) => option.value === value)
  return match ? match.label : value
}

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    amount = Number(amount) || 0
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const OrderManagement = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:4000/orders')
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể tải đơn hàng.')
      }
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch (err) {
      setError(err.message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId)
    setError('')
    setFeedback('')
    try {
      const response = await fetch(`http://localhost:4000/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật trạng thái đơn hàng.')
      }
      setFeedback('Đã cập nhật trạng thái đơn hàng.')
      setOrders((prev) =>
        prev.map((order) => (order.orderId === orderId ? data.order : order))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className='order-management'>
      <section className='order-management-card'>
        <div className='order-management-header'>
          <div>
            <h1>Quản lý đơn hàng</h1>
            <p>Theo dõi và cập nhật trạng thái đơn hàng theo thời gian thực.</p>
          </div>
          <button type='button' onClick={fetchOrders} disabled={loading}>
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
        {error && <div className='order-management-alert error'>{error}</div>}
        {feedback && <div className='order-management-alert success'>{feedback}</div>}
        <div className='order-management-list'>
          {loading && <p className='order-management-empty'>Đang tải đơn hàng...</p>}
          {!loading && orders.length === 0 && (
            <p className='order-management-empty'>Chưa có đơn hàng nào.</p>
          )}
          {!loading &&
            orders.map((order) => (
              <article key={order.orderId} className='order-card'>
                <div className='order-card-header'>
                  <div>
                    <h2>Đơn #{order.orderId}</h2>
                    <p>
                      Tạo lúc:{' '}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString('vi-VN')
                        : 'Không xác định'}
                    </p>
                  </div>
                  <div className='order-card-status'>
                    <span className={`status-badge status-${order.status}`}>
                      {statusLabel(order.status)}
                    </span>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        handleStatusChange(order.orderId, event.target.value)
                      }
                      disabled={updatingId === order.orderId}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className='order-card-content'>
                  <div className='order-card-section'>
                    <h3>Khách hàng</h3>
                    <p>{order.customer?.name || 'Khách lẻ'}</p>
                    {order.customer?.email && <p>{order.customer.email}</p>}
                  </div>
                  <div className='order-card-section order-items'>
                    <h3>Sản phẩm</h3>
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={`${order.orderId}-${index}`} className='order-item'>
                          <span>{item.name || `Sản phẩm #${item.productId || index + 1}`}</span>
                          <span>
                            {item.quantity || 0} x {formatCurrency(item.price || 0)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className='order-management-empty order-management-empty-inline'>Không có dữ liệu sản phẩm.</p>
                    )}
                  </div>
                </div>
                <div className='order-card-footer'>
                  <span>Tổng tiền</span>
                  <strong>{formatCurrency(order.total || 0)}</strong>
                </div>
              </article>
            ))}
        </div>
      </section>
      <CustomerManagement />
    </div>
  )
}

export default OrderManagement
