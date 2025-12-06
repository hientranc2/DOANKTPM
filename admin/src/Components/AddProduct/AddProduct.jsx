import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';
import { API_BASE_URL } from '../../config';

const AddProduct = () => {
  const [images, setImages] = useState([]);
  const [productDetails, setProductDetails] = useState({
    name: '',
    image: '',
    images: [],
    category: 'women',
    new_price: '',
    old_price: '',
  });

  const imageHandler = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
  };

  const changeHandler = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
  };

  const Add_Product = async () => {
    if (!images.length) {
      alert('Vui lòng chọn ít nhất một ảnh sản phẩm.');
      return;
    }

    try {
      const uploadedUrls = [];

      for (const file of images) {
        const formData = new FormData();
        formData.append('product', file);

        // eslint-disable-next-line no-await-in-loop
        const uploadResp = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
          },
          body: formData,
        });

        const uploadData = await uploadResp.json();
        if (!uploadData.success) {
          throw new Error('Upload failed');
        }
        uploadedUrls.push(uploadData.image_url);
      }

      const product = {
        ...productDetails,
        images: uploadedUrls,
        image: uploadedUrls[0],
      };

      const response = await fetch(`${API_BASE_URL}/addproduct`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      const data = await response.json();
      data.success ? alert('✅ Product Added') : alert('❌ Failed to add');
    } catch (error) {
      console.error('Add product failed:', error);
      alert('❌ Không thể thêm sản phẩm. Vui lòng thử lại.');
    }
  };

  return (
    <div className="add-product">
      <div className="addproduct-itemfield">
        <p>Product title</p>
        <input
          value={productDetails.name}
          onChange={changeHandler}
          type="text"
          name="name"
          placeholder="Type here"
        />
      </div>

      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input
            value={productDetails.old_price}
            onChange={changeHandler}
            type="text"
            name="old_price"
            placeholder="Type here"
          />
        </div>
        <div className="addproduct-itemfield">
          <p>Offer Price</p>
          <input
            value={productDetails.new_price}
            onChange={changeHandler}
            type="text"
            name="new_price"
            placeholder="Type here"
          />
        </div>
      </div>

      <div className="addproduct-itemfield">
        <p>Product Category</p>
        <select
          value={productDetails.category}
          onChange={changeHandler}
          name="category"
          className="add-product-selector"
        >
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="kid">Kid</option>
        </select>
      </div>

      <div className="addproduct-itemfield">
        <label htmlFor="file-input">
          <div className="addproduct-thumnail-img">
            {images.length ? (
              <div className="addproduct-image-preview">
                {images.map((file, index) => (
                  <img
                    key={file.name + index}
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                  />
                ))}
              </div>
            ) : (
              <img src={upload_area} alt="Upload placeholder" />
            )}
          </div>
        </label>
        <input
          onChange={imageHandler}
          type="file"
          multiple
          name="image"
          id="file-input"
          hidden
        />
      </div>

      <button onClick={Add_Product} className="addproduct-btn">
        ADD
      </button>
    </div>
  );
};

export default AddProduct;
