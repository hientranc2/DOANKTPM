import React, { useEffect, useState } from 'react'
import './ListProduct.css'
import cross_icon from '../../assets/cross_icon.png'

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [editProduct, setEditProduct] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchInfo = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('http://localhost:4000/allproducts')
      if (!response.ok) {
        throw new Error('Không thể tải danh sách sản phẩm.')
      }
      const data = await response.json()
      setAllProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
      setAllProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInfo()
  }, [])

  const removeProduct = async (id) => {
    setError('')
    setFeedback('')
    try {
      const response = await fetch('http://localhost:4000/removeproduct', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể xoá sản phẩm.')
      }
      setFeedback('Đã xoá sản phẩm thành công.')
      await fetchInfo()
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (product) => {
    setEditProduct({ ...product })
    setError('')
    setFeedback('')
  }

  const cancelEdit = () => {
    setEditProduct(null)
  }

  const updateEditField = (field, value) => {
    setEditProduct((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const submitUpdate = async () => {
    if (!editProduct) return
    setSaving(true)
    setError('')
    setFeedback('')
    try {
      const response = await fetch(`http://localhost:4000/product/${editProduct.id}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editProduct.name,
          image: editProduct.image,
          category: editProduct.category,
          new_price: editProduct.new_price,
          old_price: editProduct.old_price
        })
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Không thể cập nhật sản phẩm.')
      }
      setFeedback('Đã cập nhật sản phẩm thành công.')
      setEditProduct(null)
      await fetchInfo()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='list-product'>
      <h1>Quản lý sản phẩm</h1>
      {error && <div className='listproduct-alert listproduct-alert-error'>{error}</div>}
      {feedback && <div className='listproduct-alert listproduct-alert-success'>{feedback}</div>}
      <div className='listproduct-format-main'>
        <p>Hình ảnh</p>
        <p>Tên sản phẩm</p>
        <p>Giá cũ</p>
        <p>Giá mới</p>
        <p>Danh mục</p>
        <p>Hành động</p>
      </div>
      <div className='listproduct-allproducts'>
        <hr />
        {loading && <p className='listproduct-empty'>Đang tải sản phẩm...</p>}
        {!loading && allProducts.length === 0 && (
          <p className='listproduct-empty'>Chưa có sản phẩm nào.</p>
        )}
        {!loading &&
          allProducts.map((product) => (
            <React.Fragment key={product.id}>
              <div className='listproduct-format-main listproduct-format'>
                <img src={product.image} alt='' className='listproduct-product-icon' />
                <p>{product.name}</p>
                <p>{product.old_price}đ</p>
                <p>{product.new_price}đ</p>
                <p>{product.category}</p>
                <div className='listproduct-actions'>
                  <button type='button' onClick={() => startEdit(product)}>
                    Sửa
                  </button>
                  <img
                    onClick={() => removeProduct(product.id)}
                    className='listproduct-remove-icon'
                    src={cross_icon}
                    alt='Xoá sản phẩm'
                  />
                </div>
              </div>
              <hr />
            </React.Fragment>
          ))}
      </div>
      {editProduct && (
        <div className='listproduct-edit-modal'>
          <div className='listproduct-edit-card'>
            <h2>Chỉnh sửa sản phẩm</h2>
            <div className='listproduct-edit-grid'>
              <label>
                Tên sản phẩm
                <input
                  type='text'
                  value={editProduct.name || ''}
                  onChange={(e) => updateEditField('name', e.target.value)}
                />
              </label>
              <label>
                Ảnh (URL)
                <input
                  type='text'
                  value={editProduct.image || ''}
                  onChange={(e) => updateEditField('image', e.target.value)}
                />
              </label>
              <label>
                Danh mục
                <input
                  type='text'
                  value={editProduct.category || ''}
                  onChange={(e) => updateEditField('category', e.target.value)}
                />
              </label>
              <label>
                Giá cũ
                <input
                  type='number'
                  value={editProduct.old_price}
                  onChange={(e) => updateEditField('old_price', Number(e.target.value))}
                />
              </label>
              <label>
                Giá mới
                <input
                  type='number'
                  value={editProduct.new_price}
                  onChange={(e) => updateEditField('new_price', Number(e.target.value))}
                />
              </label>
            </div>
            <div className='listproduct-edit-actions'>
              <button type='button' className='secondary' onClick={cancelEdit} disabled={saving}>
                Huỷ
              </button>
              <button type='button' onClick={submitUpdate} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListProduct
