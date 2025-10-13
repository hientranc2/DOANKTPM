import React, { useContext } from 'react'
import { ShopContext } from '../Context/ShopContext'
import { useParams } from 'react-router-dom'
import Breadcrums from '../Components/Breadcrums/Breadcrums'
import ProductDisplay from '../Components/ProductDisplay/ProductDisplay'
import DescriptionBox from '../Components/DescriptionBox/DescriptionBox'
import RelatedProducts from '../Components/RelatedProducts/RelatedProducts'

const Product = () => {
  const { products, loadingProducts } = useContext(ShopContext)
  const { productId } = useParams()
  const product = products.find((item) => item.id === Number(productId))

  if (loadingProducts) {
    return <div className='product-page-loading'>Đang tải sản phẩm...</div>
  }

  if (!product) {
    return <div className='product-page-loading'>Không tìm thấy sản phẩm.</div>
  }

  return (
    <div>
      <Breadcrums product={product} />
      <ProductDisplay product={product} />
      <DescriptionBox />
      <RelatedProducts currentProductId={product.id} category={product.category} />
    </div>
  )
}

export default Product
