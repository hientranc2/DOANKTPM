import React, { useContext, useMemo } from 'react'
import './Popular.css'
import Item from '../Item/Item'
import { ShopContext } from '../../Context/ShopContext'

const Popular = () => {
  const { products, loadingProducts } = useContext(ShopContext)

  const popularProducts = useMemo(() => {
    if (!Array.isArray(products)) {
      return []
    }
    return products.slice(0, 4)
  }, [products])

  return (
    <div className='popular'>
      <h1>Bán chạy của phụ nữ</h1>
      <hr />
      <div className='popular-item'>
        {loadingProducts && <p className='popular-empty'>Đang tải sản phẩm...</p>}
        {!loadingProducts &&
          popularProducts.map((item) => (
            <Item
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))}
        {!loadingProducts && popularProducts.length === 0 && (
          <p className='popular-empty'>Chưa có sản phẩm nào.</p>
        )}
      </div>
    </div>
  )
}

export default Popular
