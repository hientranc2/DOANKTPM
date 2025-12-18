import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import './Navbar.css'
import { Link, useNavigate } from 'react-router-dom'

import logo from '../assests/logo.png'
import cart_icon from '../assests/cart_icon.png'
import { ShopContext } from '../../Context/ShopContext'
import nav_dropdown from '../assests/nav_dropdown.png'
import { AuthContext } from '../../Context/AuthContext'

const Navbar = () => {
    const [menu, setMenu] = useState("Cửa hàng")
    const [showSuggestions, setShowSuggestions] = useState(false)
    const { getTotalCartItems, products, searchTerm, setSearchTerm } = useContext(ShopContext);
    const menuRef = useRef();
    const suggestionRef = useRef(null)
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);

    const dropdown_toggle = (e) => {
        menuRef.current.classList.toggle('nav-menu-visible')
        e.target.classList.toggle('open')
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    const handleSearchSubmit = (event) => {
        event.preventDefault();

        const keyword = searchTerm.trim()

        if (keyword) {
            navigate(`/search?query=${encodeURIComponent(keyword)}`)
            setShowSuggestions(false)
        } else {
            navigate('/')
        }
    }
    const filteredSuggestions = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase()

        if (!keyword) return []

        return products
            .filter((product) =>
                String(product.name || '').toLowerCase().includes(keyword)
            )
            .slice(0, 6)
    }, [products, searchTerm])

    const handleSelectSuggestion = (product) => {
        setSearchTerm(product.name)
        setShowSuggestions(false)
        navigate(`/product/${product.id}`)
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])


    return (
        <div className='navbar'>
            <Link to='/' className="navbar-logo">
                <img src={logo} alt='' />
                <p>SHOPPER</p>
            </Link>
            <img className='nav-dropdown' onClick={dropdown_toggle} src={nav_dropdown} alt="" />
            <ul ref={menuRef} className="nav-menu">
                <li onClick={() => { setMenu("Cửa hàng") }}><Link to='/' style={{ textDecoration: 'none' }} >Cửa hàng</Link>{menu === "Cửa hàng" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Đàn ông") }}><Link to='/mens' style={{ textDecoration: 'none' }} >Đàn ông</Link>{menu === "Đàn ông" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Phụ nữ") }}><Link to='/womens' style={{ textDecoration: 'none' }} >Phụ nữ</Link>{menu === "Phụ nữ" ? <hr /> : <></>}</li>
                <li onClick={() => { setMenu("Trẻ em") }}><Link to='/kids' style={{ textDecoration: 'none' }} >Trẻ em</Link>{menu === "Trẻ em" ? <hr /> : <></>}</li>
            </ul>
            <div className="nav-actions">
                <div className='nav-search-wrapper' ref={suggestionRef}>
                    <form className='nav-search' onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            className='nav-search-input'
                            placeholder='Tìm sản phẩm...'
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setShowSuggestions(Boolean(e.target.value.trim()))
                            }}
                            onFocus={() => setShowSuggestions(Boolean(searchTerm.trim()))}
                        />
                    </form>

                    {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className='nav-search-suggestions'>
                            <p className='nav-search-suggestion-title'>Gợi ý nhanh</p>
                            <ul>
                                {filteredSuggestions.map((product) => (
                                    <li
                                        key={product.id}
                                        className='nav-search-suggestion-item'
                                        onClick={() => handleSelectSuggestion(product)}
                                    >
                                        <img src={product.image} alt={product.name} />
                                        <div className='nav-search-suggestion-info'>
                                            <span className='nav-search-suggestion-name'>{product.name}</span>
                                            <span className='nav-search-suggestion-price'>
                                                {Number(product.new_price).toLocaleString('vi-VN')} ₫
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

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
        </div>
    )
}

export default Navbar
