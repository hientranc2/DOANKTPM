import React, { useContext, useRef, useState } from 'react'
import './Navbar.css'
import { Link, useNavigate } from 'react-router-dom'

import logo from '../assests/logo.png'
import cart_icon from '../assests/cart_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import nav_dropdown from '../assests/nav_dropdown.png'
import { AuthContext } from '../../Context/AuthContext'

const Navbar = () => {

    const [menu, setMenu] = useState("Cửa hàng")
    const { getTotalCartItems } = useContext(ShopContext);
    const menuRef = useRef();
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    const dropdown_toggle = (e) => {
        menuRef.current.classList.toggle('nav-menu-visible');
        e.target.classList.toggle('open');
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    return (
        <div className='navbar'>
            <div className="navbar-logo">
                <img src={logo} alt='' />
                <p>SHOPPER</p>
            </div>
            <img className='nav-dropdown' onClick={dropdown_toggle} src={nav_dropdown} alt="" />
            <ul ref={menuRef} className="nav-menu">
                <li onClick={() => { setMenu("Của hàng") }}><Link to='/' style={{ textDecoration: 'none' }} >Cửa hàng</Link>{menu === "Của hàng" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Đàn ông") }}><Link to='/mens' style={{ textDecoration: 'none' }} >Đàn ông</Link>{menu === "Đàn ông" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Phụ nữ") }}><Link to='/womens' style={{ textDecoration: 'none' }} >Phụ nữ</Link>{menu === "Phụ nữ" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Trẻ em") }}><Link to='/kids' style={{ textDecoration: 'none' }} >Trẻ em</Link>{menu === "Trẻ em" ? <hr /> : <></>}</li>
            </ul>
            <div className="nav-login-cart">
                {user ? (
                    <>
                        <span className='nav-user-name'>Xin chào, {user.name}</span>
                        <button onClick={handleLogout}>Đăng xuất</button>
                    </>
                ) : (
                    <Link to='/login'><button>Đăng nhập</button></Link>
                )}
                <Link to='/cart'><img src={cart_icon} alt='' /></Link>
                <div className="nav-cart-count">{getTotalCartItems()}</div>
            </div>
        </div>
    )
}

export default Navbar
