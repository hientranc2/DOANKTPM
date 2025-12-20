import React, { useContext, useEffect, useMemo, useState } from 'react'
import './ProductDisplay.css'
import star_icon from '../assests/star_icon.png'
import star_dull_icon from '../assests/star_dull_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import { resolveImageUrl } from '../../config'
import { useNavigate } from 'react-router-dom'

const ProductDisplay = (props) => {
  const { product } = props
  const { addToCart } = useContext(ShopContext)
  const resolvedImages = useMemo(() => {
    const imageList = Array.isArray(product?.images) ? product.images : []
    const normalized = imageList
      .map((img) => resolveImageUrl(img))
      .filter(Boolean)

    const primary = resolveImageUrl(product?.image)
    if (primary && !normalized.includes(primary)) {
      normalized.unshift(primary)
    }

    return normalized.length ? normalized : primary ? [primary] : []
  }, [product])
  const [activeImage, setActiveImage] = useState(resolvedImages[0] || '')
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [sizeError, setSizeError] = useState('')
  const navigate = useNavigate()

  const sizeOptions = useMemo(() => ['S', 'M', 'L', 'XL', 'XXL'], [])

  useEffect(() => {
    setActiveImage(resolvedImages[0] || '')
  }, [resolvedImages])

  if (!product) {
    return null
  }

  // Ảnh chính hiển thị trong modal phản hồi
  const productImage = activeImage || resolvedImages[0] || ''

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError('Vui lòng chọn kích thước trước khi thêm vào giỏ hàng.')
      return
    }

    setSizeError('')
    addToCart(product.id, selectedSize, quantity)
    setIsFeedbackModalOpen(true)
  }

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => {
      const nextValue = Math.max(prev + delta, 1)
      return nextValue
    })
  }

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false)
  }

  const handleViewCart = () => {
    handleCloseFeedbackModal()
    navigate('/cart')
  }

  const handleContinueShopping = () => {
    handleCloseFeedbackModal()
    navigate('/')
  }

  return (
    <div className='productdisplay'>
      <div className='productdisplay-left'>
        <div className='productdisplay-img-list'>
          {resolvedImages.map((img) => (
            <button
              key={img}
              type='button'
              className={
                img === activeImage
                  ? 'productdisplay-thumbnail active'
                  : 'productdisplay-thumbnail'
              }
              onClick={() => setActiveImage(img)}
            >
              <img src={img} alt='Hình sản phẩm' />
            </button>
          ))}
        </div>
        <div className='prodcutdisplay-img'>
          <img className='prodcutdisplay-main-img' src={activeImage} alt='' />
        </div>
      </div>
      <div className='productdisplay-right'>
        <h1>{product.name}</h1>
        <div className='productdisplay-right-star'>
          <img src={star_icon} alt='' />
          <img src={star_icon} alt='' />
          <img src={star_icon} alt='' />
          <img src={star_icon} alt='' />
          <img src={star_dull_icon} alt='' />
          <p>(122)</p>
        </div>
        <div className='productdisplay-right-prices'>
          <div className='productdisplay-right-price-old'>
            {product.old_price}đ
          </div>
          <div className='productdisplay-right-price-new'>
            {product.new_price}đ
          </div>
        </div>
        <div className='productdisplay-right-description'></div>
        <div className='productdisplay-right-size'>
          <h1>Chọn kích thước</h1>
          <div className='productdisplay-right-sizes'>
            {sizeOptions.map((size) => (
              <button
                type='button'
                key={size}
                className={
                  size === selectedSize
                    ? 'productdisplay-size-option selected'
                    : 'productdisplay-size-option'
                }
                onClick={() => {
                  setSelectedSize(size)
                  setSizeError('')
                }}
              >
                {size}
              </button>
            ))}
          </div>
          {sizeError && <p className='productdisplay-size-error'>{sizeError}</p>}
        </div>
        <div className='productdisplay-quantity'>
          <span>Số lượng</span>
          <div className='productdisplay-quantity-controls'>
            <button
              type='button'
              onClick={() => handleQuantityChange(-1)}
              aria-label='Giảm số lượng'
            >
              −
            </button>
            <span className='productdisplay-quantity-value'>{quantity}</span>
            <button
              type='button'
              onClick={() => handleQuantityChange(1)}
              aria-label='Tăng số lượng'
            >
              +
            </button>
          </div>
        </div>
        <button onClick={handleAddToCart}>THÊM VÀO GIỎ</button>
        <p className='productdisplay-right-category'>
          <span>Danh mục: </span>Phụ nữ, Áo thun, Áo croptop
        </p>
        <p className='productdisplay-right-category'>
          <span>Thẻ: </span>Hiện đại, Mới nhất
        </p>
      </div>
      {isFeedbackModalOpen && (
        <div className='productdisplay-feedback-backdrop'>
          <div className='productdisplay-feedback-modal' role='alertdialog' aria-modal='true'>
            <button
              type='button'
              className='productdisplay-feedback-close'
              onClick={handleCloseFeedbackModal}
              aria-label='Đóng thông báo'
            >
              ×
            </button>
            <div className='productdisplay-feedback-icon'>✓</div>
            <h2>Thêm vào giỏ hàng thành công</h2>
            <div className='productdisplay-feedback-product-info'>
              <img
                className='productdisplay-feedback-product-image'
                src={productImage}
                alt={product.name}
              />
            <div className='productdisplay-feedback-product-details'>
              <p className='productdisplay-feedback-product'>{product.name}</p>
              {selectedSize && (
                <p className='productdisplay-feedback-size'>Kích thước: {selectedSize}</p>
              )}
              <p className='productdisplay-feedback-quantity'>Số lượng: {quantity}</p>
            </div>
            </div>
            <div className='productdisplay-feedback-actions'>
              <button type='button' className='continue' onClick={handleContinueShopping}>
                Tiếp tục mua sắm
              </button>
              <button type='button' className='view-cart' onClick={handleViewCart}>
                Xem giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDisplay
