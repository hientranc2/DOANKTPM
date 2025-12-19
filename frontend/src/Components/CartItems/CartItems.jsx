import React, { useContext, useEffect, useState } from 'react'
import './CartItems.css'
import { ShopContext } from '../../Context/ShopContext'
import remove_icon from '../assests/cart_cross_icon.png'
import cart_header_icon from '../assests/cart_icon.png'
import { resolveImageUrl } from '../../config'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../Context/AuthContext'

const CartItems = () => {
  const {
    getTotalCartAmount,
    products,
    cartItems,
    removeFromCart,
    loadingProducts,
    getTotalCartItems,
    addToCart,
    setCartItemQuantity
  } = useContext(ShopContext)
  const { isAuthenticated } = useContext(AuthContext)
  const navigate = useNavigate()
  const hasItemsInCart = getTotalCartItems() > 0
  const totalAmount = getTotalCartAmount()
  const [feedbackMessage, setFeedbackMessage] = useState('')

  const formatCurrency = (value) => {
    const amount = Number(value) || 0
    return `${amount.toLocaleString('vi-VN')}đ`
  }

  useEffect(() => {
    if (!feedbackMessage) return
    const timeout = setTimeout(() => setFeedbackMessage(''), 2500)
    return () => clearTimeout(timeout)
  }, [feedbackMessage])

  const handleCheckout = () => {
    if (!hasItemsInCart) {
      return
    }

    if (!isAuthenticated) {
      setFeedbackMessage('Vui lòng đăng nhập để có thể thanh toán.')
      return
    }

    navigate('/checkout')
  }

  const handleContinueShopping = () => {
    navigate('/')
  }

  return (
    <div className='cartitems'>
      <div className='cartitems-header'>
        <div className='cartitems-header-brand'>
          <img src={cart_header_icon} alt='' />
          <span>SHOPPER</span>
        </div>
        <button type='button' onClick={handleContinueShopping}>
          Tiếp tục mua hàng
        </button>
      </div>
      <div className='cartitems-format-main'>
        <p>Sản phẩm</p>
        <p>Tên</p>
        <p>Giá</p>
        <p>Số lượng</p>
        <p>Tổng</p>
        <p>Xoá</p>
      </div>
      <hr />
      {loadingProducts && <p className='cartitems-loading'>Đang tải sản phẩm...</p>}

      {!loadingProducts &&
        Object.entries(cartItems).map(([key, quantity]) => {
          if (quantity > 0) {
            const [productId, size] = key.split('-')
            const product = products.find(p => p.id === Number(productId))
            if (!product) return null

            return (
              <div key={key}>
                <div className='cartiems-format cartitems-format-main'>
                  <img
                    src={resolveImageUrl(product.image)}
                    alt={product.name}
                    className='carticon-product-icon'
                  />
                  <div>
                    <p>{product.name}</p>
                    {size && size !== 'default' && (
                      <p className='cartitems-size'>Kích thước: {size}</p>
                    )}
                  </div>
                  <p>{formatCurrency(product.new_price)}</p>
                  <div className='cartitems-quantity-control'>
                    <button
                      type='button'
                      onClick={() => removeFromCart(product.id, size)}
                      aria-label='Giảm số lượng'
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      type='button'
                      onClick={() => addToCart(product.id, size)}
                      aria-label='Tăng số lượng'
                    >
                      +
                    </button>
                  </div>
                  <p>{formatCurrency(product.new_price * quantity)}</p>
                  <img
                    src={remove_icon}
                    onClick={() => setCartItemQuantity(product.id, size, 0)}
                    alt='Xoá khỏi giỏ'
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <hr />
              </div>
            )
          }
          return null
        })
      }

      <div className='cartitems-down'>
        <div className='cartitems-total'>
          <h1>Tổng giỏ hàng</h1>
          <div>
            <div className='cartitems-total-item'>
              <p>Tạm tính</p>
              <p>{formatCurrency(totalAmount)}</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <p>Phí vận chuyển</p>
              <p>Miễn phí</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <h3>Tổng cộng</h3>
              <h3>{formatCurrency(totalAmount)}</h3>
            </div>
          </div>
          <button onClick={handleCheckout} disabled={!hasItemsInCart}>
            TIẾN HÀNH THANH TOÁN
          </button>
          {feedbackMessage && (
            <p className='cartitems-feedback'>{feedbackMessage}</p>
          )}
        </div>
        <div className='cartitems-promocode'>
          <p>Nếu bạn có mã giảm giá, hãy nhập tại đây</p>
          <div className='cartitems-promobox'>
            <input type='text' placeholder='Mã giảm giá' />
            <button>Áp dụng</button>
          </div>
        </div>
      </div>
      {!loadingProducts && !hasItemsInCart && (
        <p className='cartitems-empty'>Giỏ hàng của bạn đang trống.</p>
      )}
    </div>
  )
}

export default CartItems
