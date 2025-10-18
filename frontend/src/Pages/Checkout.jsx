import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import './Checkout.css'
import { ShopContext } from '../Context/ShopContext'
import { Link, useNavigate } from 'react-router-dom'

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

const formatCurrency = (value) => {
  const amount = Number(value) || 0
  return `${amount.toLocaleString('vi-VN')}đ`
}

const formatDeliveryDate = (date) =>
  date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

const createOrderCode = () => `NK${Date.now().toString().slice(-6)}`

const Checkout = () => {
  const navigate = useNavigate()
  const { cartItems, products, clearCart } = useContext(ShopContext)
  const [formData, setFormData] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [orderSummary, setOrderSummary] = useState(null)
  const paymentTimeoutRef = useRef(null)

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

  const paymentStepClass = `checkout-step ${paymentComplete ? 'completed' : 'current'}`
  const confirmationStepClass = `checkout-step ${paymentComplete ? 'completed' : ''}`

  useEffect(() => {
    if (!paymentComplete) {
      return
    }

    const redirectTimer = setTimeout(() => navigate('/'), 4000)
    return () => clearTimeout(redirectTimer)
  }, [paymentComplete, navigate])

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

  const handleSubmit = (event) => {
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

    processPayment()
  }

  const processPayment = () => {
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current)
    }

    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 3)

    const simulatedOrder = {
      orderCode: createOrderCode(),
      customerName: formData.name.trim(),
      customerEmail: formData.email.trim(),
      shippingAddress: formData.address.trim(),
      paymentMethod: formData.paymentMethod,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      total,
      estimatedDelivery: formatDeliveryDate(estimatedDelivery)
    }

    paymentTimeoutRef.current = setTimeout(() => {
      setSubmitting(false)
      setOrderSummary(simulatedOrder)
      setPaymentComplete(true)
      clearCart()
      setFormData(initialFormState)
      paymentTimeoutRef.current = null
    }, 1200)
  }

  useEffect(
    () => () => {
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current)
      }
    },
    []
  )

  if (paymentComplete && orderSummary) {
    return (
      <div className='checkout checkout--success'>
        <div className='checkout-success checkout-success--full'>
          <div className='checkout-success-icon' aria-hidden='true'>
            <svg viewBox='0 0 24 24' role='img'>
              <path
                fill='currentColor'
                d='M9.5 16.17 5.33 12l-1.41 1.41 5.58 5.58L20.5 7.99 19.09 6.58z'
              />
            </svg>
          </div>
          <h2>THANH TOÁN THÀNH CÔNG</h2>
          <p className='checkout-success-note'>
            Đơn hàng <strong>#{orderSummary.orderCode}</strong> của bạn đã được xác nhận. Bạn sẽ được
            chuyển hướng về trang chủ trong giây lát.
          </p>

          <div className='checkout-success-meta'>
            <div className='checkout-success-meta-card'>
              <h3>Người nhận</h3>
              <p>{orderSummary.customerName}</p>
              <span>{orderSummary.customerEmail}</span>
            </div>
            <div className='checkout-success-meta-card'>
              <h3>Địa chỉ giao hàng</h3>
              <p>{orderSummary.shippingAddress}</p>
              <span>Giao dự kiến: {orderSummary.estimatedDelivery}</span>
            </div>
            <div className='checkout-success-meta-card'>
              <h3>Phương thức</h3>
              <p>{paymentMethodLabels[orderSummary.paymentMethod]}</p>
            </div>
          </div>

          <div className='checkout-success-items'>
            {orderSummary.items.map((item) => (
              <div key={`${orderSummary.orderCode}-${item.id}`} className='checkout-success-item'>
                <div>
                  <span className='checkout-success-item-name'>{item.name}</span>
                  <span className='checkout-success-item-qty'>Số lượng: {item.quantity}</span>
                </div>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className='checkout-success-total'>Tổng cộng: {formatCurrency(orderSummary.total)}</div>

          <div className='checkout-success-actions'>
            <button type='button' onClick={() => navigate('/')}>Về trang chủ ngay</button>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className='checkout'>
      <div className='checkout-header'>
        <h1>Thanh toán</h1>
        <p>Hoàn tất đơn hàng của bạn với trải nghiệm nhanh chóng và tinh gọn như Nike.</p>
      </div>

      {hasItems && (
        <div className='checkout-steps'>
          <div className='checkout-step completed'>
            <span className='checkout-step-index'>1</span>
            <span>Giỏ hàng</span>
          </div>
          <div className={paymentStepClass}>
            <span className='checkout-step-index'>2</span>
            <span>Thanh toán</span>
          </div>
          <div className={confirmationStepClass}>
            <span className='checkout-step-index'>3</span>
            <span>Hoàn tất</span>
          </div>
        </div>
      )}

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
