import React, { useContext } from 'react'
import Hero from '../Components/Hero/Hero'
import Popular from '../Components/Popular/Popular'
import Offers from '../Components/Offers/Offers'
import { NewCollections } from '../Components/NewCollections/NewCollections'
import { NewsLetter } from '../Components/NewsLetter/NewsLetter'
import { ShopContext } from '../Context/ShopContext'

const Shop = () => {
  const { productError, refreshProducts, loadingProducts } = useContext(ShopContext)

  return (
    <div>
      {productError && (
        <div className='shop-error-banner'>
          <span>{productError}</span>
          <button onClick={refreshProducts} disabled={loadingProducts}>
            {loadingProducts ? 'Đang tải...' : 'Thử lại'}
          </button>
        </div>
      )}
      <Hero />
      <Popular />
      <Offers />
      <NewCollections />
      <NewsLetter />
    </div>
  )
}

export default Shop
