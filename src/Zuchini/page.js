"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../store/slices/productSlice";
import { FaTag, FaMoneyBillWave, FaImage, FaSearch } from "react-icons/fa";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
// import "./globals.css";

export default function CarrefourPage() {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products?.items || []);
  const loading = useSelector((state) => state.products?.loading);
  const error = useSelector((state) => state.products?.error);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    // Filter products based on search term
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, products]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generate pagination numbers
  const getPaginationGroup = () => {
    let start = Math.max(currentPage - 2, 1);
    let end = Math.min(start + 4, totalPages);
    
    if (end - start < 4) {
      start = Math.max(end - 4, 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100
      }
    }
  };

  const shimmerVariants = {
    animate: {
      backgroundPosition: ["0% 0%", "100% 100%"],
      transition: {
        repeat: Infinity,
        duration: 1.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          🛒 Carrefour Products
        </motion.h1>

        {loading ? (
          <motion.div 
            className="flex flex-col items-center space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-center text-lg text-gray-400 mb-6">Loading products...</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {[...Array(6)].map((_, i) => (
                <motion.div 
                  key={i}
                  className="h-32 rounded-lg bg-gray-800"
                  variants={shimmerVariants}
                  animate="animate"
                  style={{
                    backgroundImage: "linear-gradient(to right, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)",
                    backgroundSize: "200% 100%"
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center max-w-2xl mx-auto"
          >
            <p className="text-red-400 text-lg">Error: {error}</p>
            <button
              onClick={() => dispatch(fetchProducts())}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {products.length > 0 ? (
                <div className="w-full max-w-6xl">
                  <motion.div 
                    className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-lg text-blue-300">
                      <span className="font-bold">{filteredProducts.length}</span> products found
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="bg-gray-800/50 rounded-xl overflow-hidden shadow-2xl border border-gray-700"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="overflow-x-auto">
                      <motion.table 
                        className="w-full"
                        variants={tableVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-900/50 to-green-900/50 text-white border-b border-gray-600">
                            <th className="p-4 text-left">📌 Product Name</th>
                            <th className="p-4 text-left">💰 Current Price</th>
                            <th className="p-4 text-left">🔥 New Price</th>
                            <th className="p-4 text-left">🖼️ Image</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentProducts.map((product) => (
                            <motion.tr 
                              key={product.id} 
                              className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                              variants={rowVariants}
                              whileHover={{ scale: 1.01 }}
                            >
                              <td className="p-4 flex items-center">
                                <FaTag className="mr-2 text-blue-400" /> 
                                <span className="font-medium">{product.name}</span>
                              </td>
                              <td className="p-4">
                                {product.newPrice !== undefined ? (
                                  <motion.span 
                                    className="inline-block px-3 py-1 bg-green-900/30 text-green-400 font-semibold rounded-full"
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    Ksh {(product.currentPrice ?? 0).toFixed(2)}
                                  </motion.span>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </td>
                              <td className="p-4">
                                {product.newPrice !== undefined ? (
                                  <motion.span 
                                    className="inline-block px-3 py-1 bg-green-900/30 text-green-400 font-semibold rounded-full"
                                    whileHover={{ scale: 1.05 }}
                                  >
                                    Ksh {(product.newPrice ?? 0).toFixed(2)}
                                  </motion.span>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </td>
                              <td className="p-4">
                              <a 
                                href={product.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <motion.div 
                                  whileHover={{ scale: 1.1 }} 
                                  whileTap={{ scale: 0.95 }} 
                                  className="relative overflow-hidden rounded-lg group"
                                >
                                  {/* Product Image */}
                                  <img
                                    src={product.url} 
                                    alt={product.name} 
                                    className="w-24 h-24 object-cover rounded-lg border border-gray-600 group-hover:opacity-90 transition-all"
                                  />
                                  
                                  {/* Overlay with Icon on Hover */}
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <FaImage className="text-white text-xl" />
                                  </div>
                                </motion.div>
                              </a>
                            </td>

                            </motion.tr>
                          ))}
                        </tbody>
                      </motion.table>
                    </div>
                  </motion.div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <motion.div 
                      className="flex justify-center items-center mt-8 space-x-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 flex items-center bg-gray-800 text-white rounded-md hover:bg-gray-700 transition ${
                          currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        whileHover={currentPage !== 1 ? { scale: 1.05 } : {}}
                        whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
                      >
                        <MdNavigateBefore className="mr-1" size={20} /> Prev
                      </motion.button>
                      
                      {getPaginationGroup().map(num => (
                        <motion.button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-10 h-10 rounded-md flex items-center justify-center ${
                            currentPage === num 
                              ? "bg-blue-600 text-white" 
                              : "bg-gray-800 text-white hover:bg-gray-700"
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {num}
                        </motion.button>
                      ))}
                      
                      <motion.button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 flex items-center bg-gray-800 text-white rounded-md hover:bg-gray-700 transition ${
                          currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        whileHover={currentPage !== totalPages ? { scale: 1.05 } : {}}
                        whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
                      >
                        Next <MdNavigateNext className="ml-1" size={20} />
                      </motion.button>
                    </motion.div>
                  )}
                  
                  <motion.p 
                    className="text-center text-gray-400 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </motion.p>
                </div>
              ) : (
                <motion.div 
                  className="text-center bg-gray-800/40 rounded-xl p-10 border border-gray-700 max-w-md"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <p className="text-gray-300 text-lg mb-4">No products found</p>
                  <motion.button
                    onClick={() => dispatch(fetchProducts())}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Manually Fetch Products
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}