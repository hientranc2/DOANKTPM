import React, { useContext, useMemo } from 'react'
import './NewCollections.css'
import Item from '../Item/Item'
import { ShopContext } from '../../Context/ShopContext'

export const NewCollections = () => {
  const { products, loadingProducts } = useContext(ShopContext)

  const collections = useMemo(() => {
    if (!Array.isArray(products)) {
      return []
    }
    const toTimestamp = (value) => {
      if (!value) return 0
      const parsed = new Date(value)
      return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
    }
    const sorted = [...products].sort(
      (a, b) => toTimestamp(b.date) - toTimestamp(a.date)
    )
    return sorted.slice(0, 8)
  }, [products])

  return (
    <div className='new-collections'>
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className='collections'>
        {loadingProducts && (
          <p className='collections-empty'>Đang tải bộ sưu tập...</p>
        )}
        {!loadingProducts &&
          collections.map((item) => (
            <Item
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))}
        {!loadingProducts && collections.length === 0 && (
          <p className='collections-empty'>Chưa có bộ sưu tập mới.</p>
        )}
      </div>
    </div>
  )
}
