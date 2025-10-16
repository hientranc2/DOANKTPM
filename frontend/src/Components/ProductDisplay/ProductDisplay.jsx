import React, { useContext } from 'react'
import './ProductDisplay.css'
import star_icon from '../assests/star_icon.png'
import star_dull_icon from '../assests/star_dull_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import { resolveImageUrl } from '../../config'

const ProductDisplay = (props) => {

    const { product } = props;
    const { addToCart } = useContext(ShopContext);
    const productImage = resolveImageUrl(product?.image);

    if (!product) {
        return null;
    }

    return (
        <div className='productdisplay'>
            <div className="productdisplay-left">
                <div className="productdisplay-img-list">
                    <img src={productImage} alt="" />
                    <img src={productImage} alt="" />
                    <img src={productImage} alt="" />
                    <img src={productImage} alt="" />
                </div>
                <div className="prodcutdisplay-img">
                    <img className='prodcutdisplay-main-img' src={productImage} alt="" />
                </div>
            </div>
            <div className="productdisplay-right">
                <h1>{product.name}</h1>
                <div className="productdisplay-right-star">
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_icon} alt="" />
                    <img src={star_dull_icon} alt="" />
                    <p>(122)</p>
                </div>
                <div className="productdisplay-right-prices">
                    <div className="productdisplay-right-price-old">{product.old_price}đ</div>
                    <div className="productdisplay-right-price-new">{product.new_price}đ</div>
                </div>
                <div className="productdisplay-right-description">

                </div>
                <div className="productdisplay-right-size">
                    <h1>Select Size</h1>
                    <div className="productdisplay-right-sizes">
                        <div>S</div>
                        <div>M</div>
                        <div>L</div>
                        <div>XL</div>
                        <div>XXL</div>
                    </div>
                </div>
                <button onClick={() => { addToCart(product.id) }}>ADD TO CART</button>
                <p className="productdisplay-right-category"><span>Category: </span>Women, T-Shirt, Crop Top</p>
                <p className="productdisplay-right-category"><span>Tag: </span>Modern, Latest</p>

            </div>
        </div>
    )
}

export default ProductDisplay
