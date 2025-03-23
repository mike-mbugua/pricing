import React from 'react';
import { Link, useParams } from 'react-router-dom';

function StorePage() {
  const { storeName } = useParams();
  const formattedStoreName = storeName.charAt(0).toUpperCase() + storeName.slice(1);
  
  const actions = [
    {
      name: 'Create Product',
      description: `Add new products to the ${formattedStoreName} database`,
      icon: '✏️',
      path: `/store/${storeName}/create`,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'View Products',
      description: `Browse all ${formattedStoreName} products and their prices`,
      icon: '👁️',
      path: `/store/${storeName}/view`,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Price Comparison',
      description: `Compare ${formattedStoreName} prices with other stores`,
      icon: '📊',
      path: `/store/${storeName}/compare`,
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">{formattedStoreName}</h1>
        <p className="text-gray-300 text-xl">What would you like to do?</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {actions.map((action) => (
          <Link
            key={action.name}
            to={action.path}
            className={`${action.color} rounded-lg shadow-lg transition-transform transform hover:scale-105`}
          >
            <div className="p-6">
              <div className="text-4xl mb-4">{action.icon}</div>
              <h2 className="text-2xl font-bold mb-2 text-white">{action.name}</h2>
              <p className="text-white opacity-80">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default StorePage;