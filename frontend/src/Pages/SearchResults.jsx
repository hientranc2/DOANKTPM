import React, { useContext, useEffect, useMemo, useState } from 'react'
import './CSS/ShopCategory.css'
import { useLocation } from 'react-router-dom'
import Item from '../Components/Item/Item'
import { ShopContext } from '../Context/ShopContext'

const SearchResults = () => {
  const { products, loadingProducts, searchTerm, setSearchTerm } =
    useContext(ShopContext)
  const location = useLocation()
  const [sortType, setSortType] = useState('default')

  // Đồng bộ từ khoá tìm kiếm từ query param (nếu có)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const query = params.get('query') || ''

    if (searchTerm !== query) {
      setSearchTerm(query)
    }
  }, [location.search, searchTerm, setSearchTerm])

  // Danh sách sản phẩm đã lọc + sắp xếp
  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : []

    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) {
      return []
    }

    list = list.filter((p) => String(p.name || '').toLowerCase().includes(keyword))

    if (sortType === 'price-asc') {
      list.sort((a, b) => Number(a.new_price || 0) - Number(b.new_price || 0))
    } else if (sortType === 'price-desc') {
      list.sort((a, b) => Number(b.new_price || 0) - Number(a.new_price || 0))
    }

    return list
  }, [products, searchTerm, sortType])

  return (
    <div className='shop-category'>
      <div className='shopcategory-indexSort'>
        <p>
          {searchTerm.trim()
            ? (
              <>
                <span>Đang hiển thị {filteredProducts.length}</span> sản phẩm cho từ khóa
                <strong> "{searchTerm.trim()}"</strong>
              </>
            )
            : (
              <span>Nhập từ khóa để tìm kiếm sản phẩm.</span>
            )}
        </p>

        <div className='shopcategory-controls'>
          <div className='shopcategory-sort'>
            <span className='shopcategory-sort-label'>Sắp xếp theo:</span>
            <select
              className='sort-dropdown'
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              disabled={!searchTerm.trim()}
            >
              <option value='default'>Mặc định</option>
              <option value='price-asc'>Giá tăng dần</option>
              <option value='price-desc'>Giá giảm dần</option>
            </select>
          </div>
        </div>
      </div>

      <div className='shopcategory-products'>
        {loadingProducts && (
          <p className='shopcategory-empty'>Đang tải sản phẩm...</p>
        )}

        {!loadingProducts && filteredProducts.map((item) => (
          <Item
            key={item.id}
            id={item.id}
            name={item.name}
            image={item.image}
            new_price={item.new_price}
            old_price={item.old_price}
          />
        ))}

        {!loadingProducts && searchTerm.trim() && filteredProducts.length === 0 && (
          <p className='shopcategory-empty'>
            Không tìm thấy sản phẩm nào phù hợp với từ khóa đã nhập.
          </p>
        )}
      </div>
    </div>
  )
}

export default SearchResults

