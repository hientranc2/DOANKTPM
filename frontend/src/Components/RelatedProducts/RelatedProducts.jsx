import React, { useContext, useMemo } from 'react'
import './RelatedProducts.css'
import Item from '../Item/Item'
import { ShopContext } from '../../Context/ShopContext'

const RelatedProducts = ({ currentProductId, category }) => {
  const { products, loadingProducts } = useContext(ShopContext)

  const relatedProducts = useMemo(() => {
    if (!Array.isArray(products)) {
      return []
    }
    return products
      .filter((product) => {
        if (currentProductId && product.id === currentProductId) {
          return false
        }
        if (category) {
          return product.category === category
        }
        return true
      })
      .slice(0, 4)
  }, [products, currentProductId, category])

  return (
    <div className='relatedproducts'>
      <h1>Related Products</h1>
      <hr />
      <div className='relatedproducts-item'>
        {loadingProducts && (
          <p className='relatedproducts-empty'>Đang tải sản phẩm liên quan...</p>
        )}
        {!loadingProducts &&
          relatedProducts.map((item) => (
            <Item
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))}
        {!loadingProducts && relatedProducts.length === 0 && (
          <p className='relatedproducts-empty'>Không có sản phẩm liên quan.</p>
        )}
      </div>
    </div>
  )
}

export default RelatedProducts
