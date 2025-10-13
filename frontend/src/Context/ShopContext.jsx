import React, { createContext, useCallback, useEffect, useState } from 'react'
import fallbackProducts from '../Components/assests/all_product'

export const ShopContext = createContext(null)

const buildCartFromProducts = (products, previousCart = {}) => {
  const cart = {}
  products.forEach((product) => {
    cart[product.id] = previousCart[product.id] || 0
  })
  return cart
}

const ShopContextProvider = (props) => {
  const [products, setProducts] = useState(fallbackProducts)
  const [cartItems, setCartItems] = useState(() =>
    buildCartFromProducts(fallbackProducts)
  )
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const response = await fetch('http://localhost:4000/allproducts')
      if (!response.ok) {
        throw new Error('Không thể tải danh sách sản phẩm.')
      }
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data)
        setCartItems((previous) => buildCartFromProducts(data, previous))
        setError('')
      } else {
        setProducts(fallbackProducts)
        setCartItems((previous) =>
          buildCartFromProducts(fallbackProducts, previous)
        )
        setError('Không có sản phẩm từ máy chủ, sử dụng dữ liệu mặc định.')
      }
    } catch (err) {
      console.error('Failed to load products', err)
      setProducts(fallbackProducts)
      setCartItems((previous) =>
        buildCartFromProducts(fallbackProducts, previous)
      )
      setError('Không thể tải sản phẩm mới, sử dụng dữ liệu cục bộ.')
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const addToCart = (itemId) => {
    setCartItems((prev) => {
      if (!(itemId in prev)) return prev
      return { ...prev, [itemId]: prev[itemId] + 1 }
    })
  }

  const removeFromCart = (itemId) => {
    setCartItems((prev) => {
      if (!(itemId in prev)) return prev
      const nextValue = Math.max(prev[itemId] - 1, 0)
      return { ...prev, [itemId]: nextValue }
    })
  }

  const getTotalCartAmount = () => {
    let totalAmount = 0
    for (const itemId in cartItems) {
      const quantity = cartItems[itemId]
      if (quantity > 0) {
        const itemInfo = products.find(
          (product) => product.id === Number(itemId)
        )
        if (itemInfo) {
          totalAmount += itemInfo.new_price * quantity
        }
      }
    }
    return totalAmount
  }

  const getTotalCartItems = () => {
    let totalItem = 0
    for (const itemId in cartItems) {
      totalItem += cartItems[itemId]
    }
    return totalItem
  }

  const contextValue = {
    getTotalCartItems,
    getTotalCartAmount,
    products,
    cartItems,
    addToCart,
    removeFromCart,
    loadingProducts,
    productError: error,
    refreshProducts: fetchProducts
  }

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  )
}

export default ShopContextProvider
