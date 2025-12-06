import React, {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import fallbackProducts from '../Components/assests/all_product';
import { API_BASE_URL, resolveImageUrl } from '../config';

export const ShopContext = createContext(null);

// Helper tạo key cho item theo id + size
const buildCartKey = (itemId, size) => `${itemId}-${size || 'default'}`;

const ShopContextProvider = (props) => {
  const [products, setProducts] = useState(fallbackProducts);
  const [cartItems, setCartItems] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const [userName, setUserName] = useState(
    localStorage.getItem('user_name')
  );

  // ================== LOAD PRODUCTS TỪ BACKEND ==================
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/allproducts`);
      if (!response.ok)
        throw new Error('Không thể tải danh sách sản phẩm.');

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const normalizedProducts = data.map((product) => {
          const normalizedImages = Array.isArray(product.images)
            ? product.images
                .map((img) => resolveImageUrl(img))
                .filter(Boolean)
            : []

          const primaryImage = resolveImageUrl(product.image)
          const images = normalizedImages.length
            ? normalizedImages
            : primaryImage
              ? [primaryImage]
              : []

          return {
            ...product,
            images,
            image: images[0] || primaryImage || '',
          }
        })
        setProducts(normalizedProducts);
        setError('');
      } else {
        setProducts(fallbackProducts);
        setError(
          'Không có sản phẩm từ máy chủ, sử dụng dữ liệu mặc định.'
        );
      }
    } catch (err) {
      console.error('Không thể tải sản phẩm', err);
      setProducts(fallbackProducts);
      setError('Không thể tải sản phẩm mới, sử dụng dữ liệu cục bộ.');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ================== CART LOGIC ==================

  // Thêm vào giỏ (hỗ trợ size, quantity)
  const addToCart = (itemId, size, quantity = 1) => {
    const normalizedQuantity = Number.isFinite(quantity) ? quantity : 1;
    const key = buildCartKey(itemId, size);

    setCartItems((prev) => {
      const current = prev[key] || 0;
      return {
        ...prev,
        [key]: current + normalizedQuantity,
      };
    });
  };

  // Xóa 1 đơn vị theo size
  const removeFromCart = (itemId, size) => {
    const key = buildCartKey(itemId, size);

    setCartItems((prev) => {
      if (!prev[key]) return prev;
      const next = prev[key] - 1;

      const updated = { ...prev };
      if (next > 0) updated[key] = next;
      else delete updated[key];

      return updated;
    });
  };

  // Set quantity cho 1 item (id + size)
  const setCartItemQuantity = (itemId, size, quantity) => {
    const normalizedQuantity = Number.isFinite(quantity) ? quantity : 0;
    const key = buildCartKey(itemId, size);

    setCartItems((prev) => {
      const updated = { ...prev };

      if (normalizedQuantity <= 0) {
        delete updated[key];
      } else {
        updated[key] = normalizedQuantity;
      }

      return updated;
    });
  };

  // Tổng tiền giỏ hàng
  const getTotalCartAmount = () => {
    let totalAmount = 0;

    for (const key in cartItems) {
      const quantity = cartItems[key];
      if (quantity <= 0) continue;

      const [id] = key.split('-');
      const itemInfo = products.find(
        (product) => product.id === Number(id)
      );

      if (itemInfo) {
        totalAmount += itemInfo.new_price * quantity;
      }
    }

    return totalAmount;
  };

  // Tổng số item trong giỏ
  const getTotalCartItems = () => {
    let totalItem = 0;
    for (const key in cartItems) {
      totalItem += cartItems[key];
    }
    return totalItem;
  };

  // Xóa sạch giỏ hàng
  const clearCart = useCallback(() => {
    setCartItems({});
  }, []);

  // ================== CONTEXT VALUE ==================
  const contextValue = {
    // state
    products,
    cartItems,
    loadingProducts,
    productError: error,
    userName,
    searchTerm,
    setSearchTerm,

    // cart helpers
    getTotalCartItems,
    getTotalCartAmount,
    addToCart,
    removeFromCart,
    setCartItemQuantity,
    clearCart,

    // products helpers
    refreshProducts: fetchProducts,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
