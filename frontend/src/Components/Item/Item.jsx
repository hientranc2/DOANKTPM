import React from 'react'
import './Item.css'
import { Link } from 'react-router-dom'
import { resolveImageUrl } from '../../config'

const Item = (props) => {
    const imageSrc = resolveImageUrl(props.image)
    return (
        <div className='item'>
            <Link to={`/product/${props.id}`}><img onClick={() => window.scrollTo(0, 0)} src={imageSrc} alt='' /></Link>
            <p>{props.name}</p>
            <div className="item-prices">
                <div className="item-price-new">
                    {props.new_price}đ
                </div>
                <div className="item-price-old">
                    {props.old_price}đ
                </div>
            </div>
        </div>
    )
}

export default Item
