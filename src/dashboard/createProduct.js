import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { saveProduct } from '../store/slices/productSlice';

function CreateProduct() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { store } = useParams();
  const { loading, error: reduxError } = useSelector(state => state.products);
  const [error, setError] = useState(null);
  
  const [product, setProduct] = useState({
    name: '',
    competitorName: 'carrefour', 
    currentPrice: '',
    url: '',
    newPrice: ''
  });

  useEffect(() => {
    if (store) {
      const formattedStore = store.charAt(0).toUpperCase() + store.slice(1);
      setProduct(prev => ({ ...prev, competitorName: formattedStore }));
    }
  }, [store]);

  useEffect(() => {
    if (reduxError) {
      setError(reduxError);
    }
  }, [reduxError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'currentPrice' || name === 'newPrice') {
      setProduct({ ...product, [name]: parseFloat(value) || 0 });
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const productData = {
        ...product,
        currentPrice: parseFloat(product.currentPrice),
        newPrice: parseFloat(product.newPrice) || undefined,
      };
      
      const resultAction = await dispatch(saveProduct(productData));
      
      if (saveProduct.fulfilled.match(resultAction)) {
        console.log('Product added successfully:', resultAction.payload);
        navigate(`/store/${store}/view`);
        // http://localhost:3000/store/carrefour/view
      } else {
        console.error('Failed to add product:', resultAction.error);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to add product:', err);
    }
  };

  const storeDisplayName = store ? store.charAt(0).toUpperCase() + store.slice(1) : '';

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold text-cyan-400 mb-6 text-center">
        Add New {storeDisplayName} Product
      </h1>
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-lg mb-4">
          Error: {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <label htmlFor="name" className="block text-cyan-400 font-medium mb-2">
            <span role="img" aria-label="Product">📌</span> Product Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={product.name}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="currentPrice" className="block text-cyan-400 font-medium mb-2">
            <span role="img" aria-label="Current Price">🔒</span> Current Price (Ksh)
          </label>
          <input
            type="number"
            id="currentPrice"
            name="currentPrice"
            value={product.currentPrice}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="newPrice" className="block text-cyan-400 font-medium mb-2">
            <span role="img" aria-label="New Price">🔥</span> New Price (Ksh)
          </label>
          <input
            type="number"
            id="newPrice"
            name="newPrice"
            value={product.newPrice}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
            min="0"
            step="0.01"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="url" className="block text-cyan-400 font-medium mb-2">
            <span role="img" aria-label="URL">🖼️</span> Product URL
          </label>
          <input
            type="text"
            id="url"
            name="url"
            value={product.url}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-white border border-gray-700 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-cyan-400 font-medium mb-2">
            <span role="img" aria-label="Store">🏪</span> Store
          </label>
          <input
            type="text"
            value={product.competitorName}
            className="w-full p-2 bg-gray-700 text-white border border-gray-700 rounded"
            disabled
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(`/view/${store}`)}
            className="bg-gray-700 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProduct;