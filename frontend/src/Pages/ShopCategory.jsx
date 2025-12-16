import React, { useContext, useEffect, useMemo, useState } from 'react'
import './CSS/ShopCategory.css'
import { ShopContext } from '../Context/ShopContext'
import Item from '../Components/Item/Item'

const ShopCategory = (props) => {
  const { products, loadingProducts, searchTerm } = useContext(ShopContext)
  const [sortType, setSortType] = useState('default') // default | price-asc | price-desc
  const [priceRange, setPriceRange] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 10

  const priceFilters = [
    { value: 'all', label: 'Tất cả' },
    { value: 'under-200', label: 'Dưới 200.000đ' },
    { value: '200-400', label: '200.000đ - 400.000đ' },
    { value: '400-600', label: '400.000đ - 600.000đ' },
    { value: '600-plus', label: 'Trên 600.000đ' },
  ]

  // Danh sách sản phẩm đã lọc + sắp xếp
  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : []

    // Lọc theo category nếu có
    if (props.category) {
      list = list.filter((p) => p.category === props.category)
    }

    // Lọc theo từ khoá tìm kiếm
    if (searchTerm && searchTerm.trim() !== '') {
      const keyword = searchTerm.toLowerCase()
      list = list.filter((p) =>
        String(p.name || '').toLowerCase().includes(keyword)
      )
    }

    // Lọc theo khoảng giá
    list = list.filter((p) => {
      const price = Number(p.new_price || 0)
      switch (priceRange) {
        case 'under-200':
          return price < 200000
        case '200-400':
          return price >= 200000 && price < 400000
        case '400-600':
          return price >= 400000 && price < 600000
        case '600-plus':
          return price >= 600000
        default:
          return true
      }
    })

    // Sắp xếp theo loại
    if (sortType === 'price-asc') {
      list.sort(
        (a, b) => Number(a.new_price || 0) - Number(b.new_price || 0)
      )
    } else if (sortType === 'price-desc') {
      list.sort(
        (a, b) => Number(b.new_price || 0) - Number(a.new_price || 0)
      )
    }

    return list
  }, [products, props.category, searchTerm, sortType, priceRange])

  useEffect(() => {
    setCurrentPage(1)
  }, [props.category, searchTerm, sortType, priceRange])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const startIndex = (currentPage - 1) * productsPerPage
  const displayedProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  )

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages)
    setCurrentPage(nextPage)
  }

  return (
    <div className='shop-category'>
      {/* Banner danh mục */}
      {props.banner && (
        <img src={props.banner} alt='' className='shopcategory-banner' />
      )}

      
      <div className='shopcategory-layout'>
        <aside className='shopcategory-sidebar'>
          <div className='sidebar-section'>
            <h3>Lọc theo giá</h3>
            <div className='sidebar-options'>
              {priceFilters.map((option) => (
                <label key={option.value} className='sidebar-option'>
                  <input
                    type='radio'
                    name='price-filter'
                    value={option.value}
                    checked={priceRange === option.value}
                    onChange={(e) => setPriceRange(e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        

      
          <div className='sidebar-section'>
            <h3>Sắp xếp giá</h3>
            <div className='sidebar-options'>
              <label className='sidebar-option'>
                <input
                  type='radio'
                  name='price-sort'
                  value='default'
                  checked={sortType === 'default'}
                  onChange={(e) => setSortType(e.target.value)}
                />
                <span>Mặc định</span>
              </label>
              <label className='sidebar-option'>
                <input
                  type='radio'
                  name='price-sort'
                  value='price-asc'
                  checked={sortType === 'price-asc'}
                  onChange={(e) => setSortType(e.target.value)}
                />
                <span>Giá tăng dần</span>
              </label>
              <label className='sidebar-option'>
                <input
                  type='radio'
                  name='price-sort'
                  value='price-desc'
                  checked={sortType === 'price-desc'}
                  onChange={(e) => setSortType(e.target.value)}
                />
                <span>Giá giảm dần</span>
              </label>
            </div>
          </div>

          <div className='sidebar-summary'>
            <p>
              <strong>{filteredProducts.length}</strong> sản phẩm phù hợp
            </p>
          </div>
        </aside>

        <div className='shopcategory-main'>
          <div className='shopcategory-indexSort'>
            <p>
              <span>Đang hiển thị {filteredProducts.length}</span> sản phẩm
              trong danh mục
            </p>

            <div className='shopcategory-controls'>
              <div className='shopcategory-sort'>
                <span className='shopcategory-sort-label'>Sắp xếp theo:</span>
                <select
                  className='sort-dropdown'
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                >
                  <option value='default'>Mặc định</option>
                  <option value='price-asc'>Giá tăng dần</option>
                  <option value='price-desc'>Giá giảm dần</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid sản phẩm */}
          <div className='shopcategory-products'>
            {loadingProducts && (
              <p className='shopcategory-empty'>Đang tải sản phẩm...</p>
            )}

            {!loadingProducts &&
              displayedProducts.map((item) => (
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
              <p className='shopcategory-empty'>
                Không có sản phẩm nào phù hợp.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className='shopcategory-pagination'>
        <button
          className='pagination-button'
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Trước
        </button>

        <div className='pagination-pages'>
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1
            return (
              <button
                key={pageNumber}
                className={`pagination-page ${
                  currentPage === pageNumber ? 'active' : ''
                }`}
                onClick={() => goToPage(pageNumber)}
              >
                {pageNumber}
              </button>
            )
          })}
        </div>

        <button
          className='pagination-button'
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Sau
        </button>
      </div>
    </div>
  )
}

export default ShopCategory