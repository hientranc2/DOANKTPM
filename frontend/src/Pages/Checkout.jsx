import React, { useContext, useMemo, useState } from 'react'
import './Checkout.css'
import { ShopContext } from '../Context/ShopContext'
import { API_BASE_URL } from '../config'
import { Link } from 'react-router-dom'

const initialFormState = {
  name: '',
  email: '',
  address: '',
  paymentMethod: 'credit_card',
  cardNumber: '',
  cardholderName: '',
  expiryMonth: '',
  expiryYear: '',
  cvv: ''
}

const paymentMethodLabels = {
  credit_card: 'Thẻ tín dụng/Ghi nợ',
  cash_on_delivery: 'Thanh toán khi nhận hàng'
}

const paymentStatusLabels = {
  paid: 'Đã thanh toán',
  pending: 'Chờ thanh toán',
  failed: 'Thanh toán thất bại'
}

const formatCurrency = (value) => {
  const amount = Number(value) || 0
  return `${amount.toLocaleString('vi-VN')}đ`
}

const Checkout = () => {
  const { cartItems, products, clearCart } = useContext(ShopContext)
  const [formData, setFormData] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  const items = useMemo(
    () =>
      products
        .filter((product) => cartItems[product.id] > 0)
        .map((product) => ({
          id: product.id,
          name: product.name,
          price: product.new_price,
          quantity: cartItems[product.id]
        })),
    [products, cartItems]
  )

  const hasItems = items.length > 0
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const handleInputChange = (event) => {
    const { name, value } = event.target

    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 19)
      const formatted = digits.replace(/(.{4})/g, '$1 ').trim()
      setFormData((prev) => ({ ...prev, cardNumber: formatted }))
      return
    }

    if (name === 'expiryMonth') {
      const digits = value.replace(/\D/g, '').slice(0, 2)
      setFormData((prev) => ({ ...prev, expiryMonth: digits }))
      return
    }

    if (name === 'expiryYear') {
      const digits = value.replace(/\D/g, '').slice(0, 4)
      setFormData((prev) => ({ ...prev, expiryYear: digits }))
      return
    }

    if (name === 'cvv') {
      const digits = value.replace(/\D/g, '').slice(0, 4)
      setFormData((prev) => ({ ...prev, cvv: digits }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePaymentMethodChange = (event) => {
    const method = event.target.value
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
      ...(method !== 'credit_card'
        ? { cardNumber: '', cardholderName: '', expiryMonth: '', expiryYear: '', cvv: '' }
        : {})
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!hasItems) {
      setError('Giỏ hàng của bạn đang trống.')
      return
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.address.trim()) {
      setError('Vui lòng điền đầy đủ họ tên, email và địa chỉ giao hàng.')
      return
    }

    if (formData.paymentMethod === 'credit_card') {
      if (
        !formData.cardNumber.trim() ||
        !formData.cardholderName.trim() ||
        !formData.expiryMonth.trim() ||
        !formData.expiryYear.trim() ||
        !formData.cvv.trim()
      ) {
        setError('Vui lòng nhập đầy đủ thông tin thẻ thanh toán.')
        return
      }
    }

    setSubmitting(true)
    setError('')

    try {
      const payload = {
        customerName: formData.name.trim(),
        customerEmail: formData.email.trim(),
        shippingAddress: formData.address.trim(),
        paymentMethod: formData.paymentMethod,
        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total
      }

      if (formData.paymentMethod === 'credit_card') {
        payload.paymentDetails = {
          cardNumber: formData.cardNumber.replace(/\s+/g, ''),
          cardholderName: formData.cardholderName.trim(),
          expiryMonth: formData.expiryMonth,
          expiryYear: formData.expiryYear,
          cvv: formData.cvv
        }
      }

      const response = await fetch(`${API_BASE_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Thanh toán thất bại, vui lòng thử lại.')
      }

      setOrder(data.order)
      clearCart()
      setFormData(initialFormState)
    } catch (submitError) {
      setError(submitError.message || 'Thanh toán thất bại, vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (order) {
    return (
      <div className='checkout'>
        <h1>Thanh toán</h1>
        <div className='checkout-success'>
          <h2>Thanh toán thành công!</h2>
          <p>
            Mã đơn hàng: <strong>#{order.orderId}</strong>
          </p>
          <p>
            Trạng thái thanh toán: {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
          </p>
          <p>Phương thức: {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</p>
          {order.paymentDetails?.cardLast4 && (
            <p>Thẻ thanh toán: **** **** **** {order.paymentDetails.cardLast4}</p>
          )}
          {order.shippingAddress && <p>Giao tới: {order.shippingAddress}</p>}
          <div className='checkout-success-items'>
            {order.items.map((item) => (
              <div key={`${order.orderId}-${item.productId}`} className='checkout-success-item'>
                <span>{item.name}</span>
                <span>x{item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className='checkout-success-total'>Tổng cộng: {formatCurrency(order.total)}</div>
          <Link className='checkout-success-link' to='/'>Tiếp tục mua sắm</Link>
        </div>
      </div>
    )
  }

  return (
    <div className='checkout'>
      <h1>Thanh toán</h1>
      {!hasItems ? (
        <div className='checkout-empty'>
          <p>Giỏ hàng của bạn đang trống.</p>
          <Link to='/'>Quay lại cửa hàng</Link>
        </div>
      ) : (
        <div className='checkout-content'>
          <div className='checkout-summary'>
            <h2>Đơn hàng của bạn</h2>
            <div className='checkout-summary-items'>
              {items.map((item) => (
                <div key={item.id} className='checkout-summary-item'>
                  <div>
                    <p className='checkout-summary-item-name'>{item.name}</p>
                    <p className='checkout-summary-item-qty'>Số lượng: {item.quantity}</p>
                  </div>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className='checkout-summary-total'>Tổng cộng: {formatCurrency(total)}</div>
          </div>

          <form className='checkout-form' onSubmit={handleSubmit} noValidate>
            <div className='checkout-form-group'>
              <label htmlFor='name'>Họ và tên</label>
              <input
                id='name'
                name='name'
                value={formData.name}
                onChange={handleInputChange}
                placeholder='Nguyễn Văn A'
                autoComplete='name'
                required
              />
            </div>

            <div className='checkout-form-group'>
              <label htmlFor='email'>Email</label>
              <input
                id='email'
                name='email'
                type='email'
                value={formData.email}
                onChange={handleInputChange}
                placeholder='email@domain.com'
                autoComplete='email'
                required
              />
            </div>

            <div className='checkout-form-group'>
              <label htmlFor='address'>Địa chỉ giao hàng</label>
              <textarea
                id='address'
                name='address'
                value={formData.address}
                onChange={handleInputChange}
                placeholder='Số nhà, đường, quận/huyện, tỉnh/thành phố'
                autoComplete='street-address'
                rows={3}
                required
              />
            </div>

            <div className='checkout-form-group'>
              <label htmlFor='paymentMethod'>Phương thức thanh toán</label>
              <select
                id='paymentMethod'
                name='paymentMethod'
                value={formData.paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <option value='credit_card'>Thẻ tín dụng/Ghi nợ</option>
                <option value='cash_on_delivery'>Thanh toán khi nhận hàng</option>
              </select>
            </div>

            {formData.paymentMethod === 'credit_card' && (
              <div className='checkout-card-fields'>
                <div className='checkout-form-group'>
                  <label htmlFor='cardNumber'>Số thẻ</label>
                  <input
                    id='cardNumber'
                    name='cardNumber'
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    placeholder='1234 5678 9012 3456'
                    inputMode='numeric'
                    autoComplete='cc-number'
                    required
                  />
                </div>

                <div className='checkout-form-group'>
                  <label htmlFor='cardholderName'>Tên chủ thẻ</label>
                  <input
                    id='cardholderName'
                    name='cardholderName'
                    value={formData.cardholderName}
                    onChange={handleInputChange}
                    placeholder='Tên in trên thẻ'
                    autoComplete='cc-name'
                    required
                  />
                </div>

                <div className='checkout-form-row'>
                  <div className='checkout-form-group'>
                    <label htmlFor='expiryMonth'>Tháng hết hạn</label>
                    <input
                      id='expiryMonth'
                      name='expiryMonth'
                      value={formData.expiryMonth}
                      onChange={handleInputChange}
                      placeholder='MM'
                      inputMode='numeric'
                      autoComplete='cc-exp-month'
                      required
                    />
                  </div>
                  <div className='checkout-form-group'>
                    <label htmlFor='expiryYear'>Năm hết hạn</label>
                    <input
                      id='expiryYear'
                      name='expiryYear'
                      value={formData.expiryYear}
                      onChange={handleInputChange}
                      placeholder='YYYY'
                      inputMode='numeric'
                      autoComplete='cc-exp-year'
                      required
                    />
                  </div>
                  <div className='checkout-form-group'>
                    <label htmlFor='cvv'>CVV</label>
                    <input
                      id='cvv'
                      name='cvv'
                      value={formData.cvv}
                      onChange={handleInputChange}
                      placeholder='123'
                      inputMode='numeric'
                      autoComplete='cc-csc'
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {error && <p className='checkout-error'>{error}</p>}

            <button type='submit' disabled={submitting}>
              {submitting ? 'Đang xử lý...' : `Thanh toán ${formatCurrency(total)}`}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default Checkout
