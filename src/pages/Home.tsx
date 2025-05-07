import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { Product } from '../types';

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get('/products');
        setFeaturedProducts(response.data.slice(0, 4)); // Show first 4 products
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=2850&q=80"
            alt="Gaming setup"
          />
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Welcome to Gaming Store
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl">
            Discover the latest gaming consoles and accessories. From PlayStation to Xbox,
            we have everything you need for the ultimate gaming experience.
          </p>
          <div className="mt-10">
            <Link
              to="/products"
              className="inline-block bg-blue-600 py-3 px-8 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900">Featured Products</h2>
        <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <div key={product._id} className="group relative">
              <div className="w-full min-h-80 bg-gray-200 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-52 h-52 object-center object-cover"
                />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <Link to={`/products/${product._id}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  ${product.variants[0].price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Fast Delivery</h3>
              <p className="mt-2 text-base text-gray-500">
                Get your gaming gear delivered to your doorstep within 24 hours.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Secure Payment</h3>
              <p className="mt-2 text-base text-gray-500">
                Shop with confidence using our secure payment system.
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">24/7 Support</h3>
              <p className="mt-2 text-base text-gray-500">
                Our customer support team is always ready to help you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 