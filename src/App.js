import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '../src/navBar';
import StorePage from '../src/dashboard/store';
import CreateProduct from '../src/dashboard/createProduct';
import CarrefourPage from './carrefour/page';
import ComparePrices from './dashboard/comparePrices';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-800 text-white">
        <Navbar />
        <div className="container mx-auto pt-4">
          <Routes>
            <Route path="/" element={<Navigate to="/store" />} />
            <Route path="/store/:storeName" element={<StorePage />} />            
            <Route path="/store/:storeName/create" element={<CreateProduct />} />
            <Route path="/store/:storeName/view" element={<CarrefourPage /> }/>
            <Route path="/store/:storeName/compare" element={<ComparePrices /> }/>
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;