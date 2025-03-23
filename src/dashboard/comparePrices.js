import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { scrapePrices, resetScrapeProgress } from '../store/slices/productSlice';
import { connectWebSocket, closeWebSocket } from '../utils/websocketService';

// Progress bar component
const ProgressBar = ({ value, max }) => {
  const percentage = Math.round((value / max) * 100) || 0;
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
      <div 
        className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      >
      </div>
      <div className="text-xs text-center -mt-4 text-white font-bold">
        {percentage}%
      </div>
    </div>
  );
};

// Price change display component
const PriceChangeList = ({ priceChanges }) => {
  if (!priceChanges || priceChanges.length === 0) {
    return <p className="text-gray-500 italic">No price changes detected.</p>;
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Price Changes Detected</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Previous Price</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">New Price</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">On Offer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {priceChanges.map((change) => (
              <tr key={change.id}>
                <td className="py-2 px-4 text-sm font-medium text-gray-900">
                  <a href={change.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{change.name}</a>
                </td>
                <td className="py-2 px-4 text-sm text-gray-500 text-right">KES {change.oldPrice.toFixed(2)}</td>
                <td className="py-2 px-4 text-sm text-gray-500 text-right">KES {change.newPrice.toFixed(2)}</td>
                <td className={`py-2 px-4 text-sm text-right font-medium ${change.difference < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change.difference > 0 ? '+' : ''}{change.difference.toFixed(2)} ({change.difference > 0 ? '+' : ''}{change.percentageChange}%)
                </td>
                <td className="py-2 px-4 text-sm text-gray-500 text-center">
                  {change.isOnOffer ? (
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Yes</span>
                      <div className="text-xs mt-1">Original: KES {change.originalPrice.toFixed(2)}</div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Product list component
const ProductList = ({ products, currentProduct }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Monitored Products</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competitor</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Last Checked</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className={currentProduct === product.name ? 'bg-blue-50' : ''}>
                <td className="py-2 px-4 text-sm font-medium text-gray-900">
                  <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{product.name}</a>
                </td>
                <td className="py-2 px-4 text-sm text-gray-500">{product.competitorName}</td>
                <td className="py-2 px-4 text-sm text-gray-500 text-right">
                  KES {product.currentPrice.toFixed(2)}
                  {product.isOnOffer && (
                    <div className="text-xs text-green-600">On offer (Original: KES {product.originalPrice?.toFixed(2)})</div>
                  )}
                </td>
                <td className="py-2 px-4 text-sm text-gray-500 text-center">
                  {product.lastChecked ? new Date(product.lastChecked).toLocaleString() : 'Never'}
                </td>
                <td className="py-2 px-4 text-sm text-gray-500 text-center">
                  {currentProduct === product.name ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Checking...
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {product.lastChecked ? 'Monitored' : 'Pending'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function ComparePrices() {
  const dispatch = useDispatch();
  const products = useSelector(state => state.products.items);
  const { loading, error, lastUpdated } = useSelector(state => state.products);
  const { inProgress, total, completed, priceChanges, currentProduct } = useSelector(state => state.products.scrapeProgress);
  
  const [lastScrapedTime, setLastScrapedTime] = useState(null);
  const [showProductList, setShowProductList] = useState(false);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    const socket = connectWebSocket(dispatch);
    
    // Clean up on unmount
    return () => {
      closeWebSocket();
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (lastUpdated && !inProgress) {
      setLastScrapedTime(new Date(lastUpdated));
    }
  }, [lastUpdated, inProgress]);
  
  const handleScrapePrices = async () => {
    if (!inProgress && products.length > 0) {
      await dispatch(scrapePrices());
    }
  };
  
  const handleReset = () => {
    dispatch(resetScrapeProgress());
  };
  
  const toggleProductList = () => {
    setShowProductList(!showProductList);
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Price Comparison</h2>
        <div className="flex items-center space-x-3">
          {lastScrapedTime && !inProgress && (
            <p className="text-sm text-gray-500">
              Last updated: {lastScrapedTime.toLocaleString()}
            </p>
          )}
          <button
            onClick={handleScrapePrices}
            disabled={inProgress || loading || products.length === 0}
            className={`px-4 py-2 font-medium rounded-md shadow-sm text-white ${
              inProgress || loading || products.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {inProgress ? 'Scraping...' : 'Check Prices Now'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {!products || products.length === 0 ? (
        <div className="p-4 text-center bg-gray-50 rounded border border-gray-200">
          <p className="text-gray-500">No products available for price comparison.</p>
          <p className="text-sm text-gray-400 mt-1">Add products first to enable price tracking.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Tracking {products.length} products</span>
              <button 
                onClick={toggleProductList}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showProductList ? 'Hide list' : 'Show list'}
              </button>
            </div>
          </div>
          
          {inProgress && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Scraping Prices...</h3>
                <span className="text-sm text-gray-500">{completed} of {total} products</span>
              </div>
              <ProgressBar value={completed} max={total} />
              {currentProduct && (
                <p className="text-sm text-gray-500 text-center">
                  Currently checking: {currentProduct}
                </p>
              )}
            </div>
          )}
          
          {completed > 0 && !inProgress && (
            <div className="mb-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700 flex justify-between items-center">
                <div>
                  <p className="font-medium">Price check complete</p>
                  <p className="text-sm text-green-600 mt-1">
                    {priceChanges.length > 0 
                      ? `Found ${priceChanges.length} price changes across ${total} products` 
                      : `No price changes detected across ${total} products`}
                  </p>
                </div>
                {priceChanges.length > 0 && (
                  <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Email notification sent
                  </span>
                )}
              </div>
            </div>
          )}
          
          {showProductList && (
            <ProductList products={products} currentProduct={currentProduct} />
          )}
          
          {priceChanges && priceChanges.length > 0 && !inProgress && (
            <PriceChangeList priceChanges={priceChanges} />
          )}
          
          {!inProgress && completed > 0 && (
            <div className="mt-6 text-right">
              <button
                onClick={handleReset}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Results
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ComparePrices;