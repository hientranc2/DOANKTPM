
import './App.css';
import Navbar from './Components/Navbar/Navbar'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Shop from './Pages/Shop';
import ShopCategory from './Pages/ShopCategory';
import Cart from './Pages/Cart';
import LoginSignup from './Pages/LoginSignup'
import Product from './Pages/Product'
import Footer from './Components/Footer/Footer';
import men_banner from './Components/assests/banner_mens.png';
import women_banner from './Components/assests/banner_women.png';
import kid_banner from './Components/assests/banner_kids.png';
import Checkout from './Pages/Checkout'

const AppRoutes = () => {
  const location = useLocation()
  const hideLayout = location.pathname.startsWith('/login')

  return (
    <>
      {!hideLayout && <Navbar />}
      <Routes>
        <Route path='/' element={<Shop />} />
        <Route path='/mens' element={<ShopCategory banner={men_banner} category="men" />} />
        <Route path='/womens' element={<ShopCategory banner={women_banner} category="women" />} />
        <Route path='/kids' element={<ShopCategory banner={kid_banner} category="kid" />} />
        <Route path='product' element={<Product />}>
          <Route path=':productId' element={<Product />} />
        </Route>
        <Route path='/cart' element={<Cart />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path='/login' element={<LoginSignup />} />
      </Routes>
      {!hideLayout && <Footer />}
    </>
  )
}

function App() {
  return (
    <div>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </div>
  );
}

export default App;
