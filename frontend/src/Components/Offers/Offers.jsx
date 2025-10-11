import React from 'react'
import './Offers.css'
import exclusive_image from '../assests/exclusive_image.png'

const Offers = () => {
    return (
        <div className='offers'>
            <div className='offers-left'>
                <h1>Độc quyền</h1>
                <h1>Ưu đãi dành cho bạn</h1>
                <p>CHỈ ÁP DỤNG CHO SẢN PHẨM BÁN CHẠY NHẤT</p>
                <button>Kiểm tra ngay</button>
            </div>
            <div className="offers-right">
                <img src={exclusive_image} alt='' />
            </div>
        </div>
    )
}

export default Offers
