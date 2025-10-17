import React, { useContext } from 'react'
import './CartItems.css'
import { ShopContext } from '../../Context/ShopContext'
import remove_icon from '../assests/cart_cross_icon.png'
import { resolveImageUrl } from '../../config'
import { useNavigate } from 'react-router-dom'

const CartItems = () => {
  const {
    getTotalCartAmount,
    products,
    cartItems,
    removeFromCart,
    loadingProducts,
    getTotalCartItems
  } = useContext(ShopContext)
  const navigate = useNavigate()
  const hasItemsInCart = getTotalCartItems() > 0
  const totalAmount = getTotalCartAmount()

  const formatCurrency = (value) => {
    const amount = Number(value) || 0
    return `${amount.toLocaleString('vi-VN')}đ`
  }

  return (
    <div className='cartitems'>
      <div className='cartitems-format-main'>
        <p>Products</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />
      {loadingProducts && <p className='cartitems-loading'>Đang tải sản phẩm...</p>}
      {!loadingProducts &&
        products.map((product) => {
          if (cartItems[product.id] > 0) {
            return (
              <div key={product.id}>
                <div className='cartiems-format cartitems-format-main'>
                  <img
                    src={resolveImageUrl(product.image)}
                    alt={product.name}
                    className='carticon-product-icon'
                  />
                  <p>{product.name}</p>
                  <p>{formatCurrency(product.new_price)}</p>
                  <button className='cartitems-quantity'>
                    {cartItems[product.id]}
                  </button>
                  <p>{formatCurrency(product.new_price * cartItems[product.id])}</p>
                  <img
                    src={remove_icon}
                    onClick={() => {
                      removeFromCart(product.id)
                    }}
                    alt='Xoá khỏi giỏ'
                  />
                </div>
                <hr />
              </div>
            )
          }
          return null
        })}
      <div className='cartitems-down'>
        <div className='cartitems-total'>
          <h1>Cart Total</h1>
          <div>
            <div className='cartitems-total-item'>
              <p>Subtotal</p>
              <p>{formatCurrency(totalAmount)}</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className='cartitems-total-item'>
              <h3>Total</h3>
              <h3>{formatCurrency(totalAmount)}</h3>
            </div>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            disabled={!hasItemsInCart}
          >
            TIẾN HÀNH THANH TOÁN
          </button>
        </div>
        <div className='cartitems-promocode'>
          <p>If you have a promo code, Enter it here</p>
          <div className='cartitems-promobox'>
            <input type='text' placeholder='promo code' />
            <button>Submit</button>
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
