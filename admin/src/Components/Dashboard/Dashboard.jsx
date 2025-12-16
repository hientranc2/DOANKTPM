import React, { useEffect, useMemo, useState } from 'react'
import './Dashboard.css'
import { API_BASE_URL } from '../../config'

const formatCurrency = (amount) => {
  const numeric = typeof amount === 'number' ? amount : Number(amount) || 0
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numeric)
}

const normalizeDate = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const computeTotalsFromItems = (items = []) =>
  items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0)

const Dashboard = () => {
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [ordersResp, usersResp] = await Promise.all([
          fetch(`${API_BASE_URL}/orders`),
          fetch(`${API_BASE_URL}/users`)
        ])

        const ordersData = await ordersResp.json()
        if (!ordersResp.ok || !ordersData.success) {
          throw new Error(ordersData.message || 'Không thể tải đơn hàng')
        }

        const usersData = await usersResp.json()
        if (!usersResp.ok || !usersData.success) {
          throw new Error(usersData.message || 'Không thể tải khách hàng')
        }

        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : [])
        setUsers(Array.isArray(usersData.users) ? usersData.users : [])
      } catch (err) {
        setError(err.message)
        setOrders([])
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const now = useMemo(() => new Date(), [])

  const metrics = useMemo(() => {
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const revenue = { today: 0, month: 0 }
    let totalOrders = 0
    let needingAction = 0

    const productMap = new Map()

    for (const order of orders) {
      const createdAt = normalizeDate(order.createdAt)
      const total = Number(order.total)
      const resolvedTotal = Number.isNaN(total)
        ? computeTotalsFromItems(order.items)
        : total

      totalOrders += 1
      if (['pending', 'processing'].includes(order.status)) {
        needingAction += 1
      }

      if (createdAt) {
        if (createdAt >= startOfToday) {
          revenue.today += resolvedTotal
        }
        if (createdAt >= startOfMonth) {
          revenue.month += resolvedTotal
        }
      }

      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const key = item.productId || item.name || `${order.orderId}-${Math.random()}`
          if (!productMap.has(key)) {
            productMap.set(key, {
              name: item.name || `Sản phẩm #${item.productId || productMap.size + 1}`,
              quantity: 0,
              revenue: 0
            })
          }
          const current = productMap.get(key)
          const qty = Number(item.quantity) || 0
          const price = Number(item.price) || 0
          current.quantity += qty
          current.revenue += qty * price
        }
      }
    }

    const bestSellers = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    const newUsers = { today: 0, month: 0, latest: [] }

    const latestUsers = [...users]
      .map((user) => ({ ...user, createdAt: normalizeDate(user.createdAt) }))
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))

    for (const user of latestUsers) {
      if (!user.createdAt) continue
      if (user.createdAt >= startOfToday) {
        newUsers.today += 1
      }
      if (user.createdAt >= startOfMonth) {
        newUsers.month += 1
      }
    }

    newUsers.latest = latestUsers.slice(0, 6)

    return {
      revenue,
      totalOrders,
      needingAction,
      bestSellers,
      newUsers
    }
  }, [orders, users, now])

  return (
    <div className='dashboard'>
      <div className='dashboard-header'>
        <div>
          <p className='eyebrow'>Tổng quan</p>
          <h1>Bảng điều khiển</h1>
          <p className='subtitle'>Nắm nhanh doanh thu, đơn hàng, sản phẩm và người dùng mới.</p>
        </div>
        {loading && <span className='tag'>Đang tải...</span>}
      </div>

      {error && <div className='dashboard-alert error'>{error}</div>}

      <section className='dashboard-grid'>
        <article className='stat-card'>
          <p>Doanh thu hôm nay</p>
          <h2>{formatCurrency(metrics.revenue.today)}</h2>
          <span className='badge neutral'>Cập nhật theo đơn tạo hôm nay</span>
        </article>
        <article className='stat-card'>
          <p>Doanh thu tháng này</p>
          <h2>{formatCurrency(metrics.revenue.month)}</h2>
          <span className='badge neutral'>Từ đầu tháng</span>
        </article>
        <article className='stat-card'>
          <p>Tổng số đơn</p>
          <h2>{metrics.totalOrders}</h2>
          <span className='badge accent'>Đơn đã ghi nhận</span>
        </article>
        <article className='stat-card'>
          <p>Đơn cần xử lý</p>
          <h2>{metrics.needingAction}</h2>
          <span className='badge warning'>Pending / Processing</span>
        </article>
      </section>

      <section className='dashboard-panels'>
        <article className='panel'>
          <div className='panel-header'>
            <div>
              <p className='eyebrow'>Bán chạy</p>
              <h3>Sản phẩm được mua nhiều</h3>
            </div>
            <span className='tag'>{metrics.bestSellers.length} sản phẩm</span>
          </div>
          {metrics.bestSellers.length === 0 ? (
            <p className='empty'>Chưa có dữ liệu bán hàng.</p>
          ) : (
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đã bán</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {metrics.bestSellers.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className='panel'>
          <div className='panel-header'>
            <div>
              <p className='eyebrow'>Người dùng mới</p>
              <h3>Tăng trưởng khách hàng</h3>
            </div>
            <div className='tag-group'>
              <span className='tag'>{metrics.newUsers.today} hôm nay</span>
              <span className='tag neutral'>{metrics.newUsers.month} tháng này</span>
            </div>
          </div>
          {metrics.newUsers.latest.length === 0 ? (
            <p className='empty'>Chưa có người dùng mới.</p>
          ) : (
            <div className='user-list'>
              {metrics.newUsers.latest.map((user, index) => (
                <div key={`${user.email}-${index}`} className='user-row'>
                  <div>
                    <p className='user-name'>{user.name}</p>
                    <p className='user-email'>{user.email}</p>
                  </div>
                  <div className='user-meta'>
                    <span className={`status-pill status-${user.status || 'active'}`}>
                      {user.status === 'suspended' ? 'Bị khoá' : 'Hoạt động'}
                    </span>
                    <span className='user-date'>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                        : 'Không rõ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
const computeRevenueFromOrders = (orders = [], now = new Date()) => {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let today = 0;
  let month = 0;
  let year = 0;

  for (const order of orders) {
    const createdAt = normalizeDate(order.createdAt);
    if (!createdAt) continue;

    const total = Number(order.total);
    const resolvedTotal = Number.isNaN(total)
      ? computeTotalsFromItems(order.items)
      : total;

    if (createdAt >= startOfToday) today += resolvedTotal;
    if (createdAt >= startOfMonth) month += resolvedTotal;
    if (createdAt >= startOfYear) year += resolvedTotal;
  }

  return { today, month, year };
};

export default Dashboard
export {
  formatCurrency,
  normalizeDate,
  computeTotalsFromItems,
  computeRevenueFromOrders

};
