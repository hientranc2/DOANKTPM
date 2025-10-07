import React, { useState } from 'react'
import './Navbar.css'
import { Link } from 'react-router-dom'

import logo from '../assests/logo.png'
import cart_icon from '../assests/cart_icon.png'

const Navbar = () => {

    const [menu, setMenu] = useState("Cửa hàng")

    return (
        <div className='navbar'>
            <div className="navbar-logo">
                <img src={logo} alt='' />
                <p>SHOPPER</p>
            </div>
            <ul className="nav-menu">
                <li onClick={() => { setMenu("Của hàng") }}><Link style={{ textDecoration: 'none' }} to='/'>Cửa hàng</Link>{menu === "Của hàng" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Đàn ông") }}><Link style={{ textDecoration: 'none' }} to='/men'>Đàn ông</Link>{menu === "Đàn ông" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Phụ nữ") }}><Link style={{ textDecoration: 'none' }} to='/women'>Phụ nữ</Link>{menu === "Phụ nữ" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Trẻ em") }}><Link style={{ textDecoration: 'none' }} to='/kid'>Trẻ em</Link>{menu === "Trẻ em" ? <hr /> : <></>}</li>
            </ul>
            <div className="nav-login-cart">
                <Link to='/login'><button>Đăng nhập</button></Link>
                <Link to='/cart'><img src={cart_icon} alt='' /></Link>
                <div className="nav-cart-count">0</div>
            </div>
        </div>
    )
}

export default Navbar
