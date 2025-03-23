import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();
  const stores = ['Carrefour', 'Zucchini', 'Naivas'];
  
  // Helper to check if a store is active
  const isActive = (storeName) => {
    return location.pathname.includes(storeName.toLowerCase());
  };

  return (
    <nav className="bg-gray-900 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-cyan-400 text-2xl mr-2">🛒</span>
              <span className="font-bold text-xl text-cyan-400">Price Tracker</span>
            </Link>
          </div>
          
          <div className="flex space-x-6">
            {stores.map((store) => (
              <Link 
                key={store}
                to={`/store/${store.toLowerCase()}`}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  isActive(store) 
                    ? 'bg-cyan-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {store}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;