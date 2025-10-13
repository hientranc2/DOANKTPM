import React, { useContext } from 'react'
import './CSS/ShopCategory.css'
import { ShopContext } from '../Context/ShopContext'
import dropdown_icon from '../Components/assests/dropdown_icon.png'
import Item from '../Components/Item/Item'

const ShopCategory = (props) => {
  const { products, loadingProducts } = useContext(ShopContext)
  const filteredProducts = products.filter(
    (item) => item.category === props.category
  )

  return (
    <div className='shop-category'>
      <img src={props.banner} alt='' />
      <div className='shopcategory-indexSort'>
        <p>
          <span>Showing {filteredProducts.length}</span> sản phẩm trong danh mục
        </p>
        <div className='shopcategory-sort'>
          Sort by <img src={dropdown_icon} alt='' />
        </div>
      </div>
      <div className='shopcategory-products'>
        {loadingProducts && <p className='shopcategory-empty'>Đang tải sản phẩm...</p>}
        {!loadingProducts &&
          filteredProducts.map((item) => (
            <Item
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))}
        {!loadingProducts && filteredProducts.length === 0 && (
          <p className='shopcategory-empty'>Không có sản phẩm nào phù hợp.</p>
        )}
      </div>
      <div className='shopcategory-loadmore'>More</div>
    </div>
  )
}

export default ShopCategory
