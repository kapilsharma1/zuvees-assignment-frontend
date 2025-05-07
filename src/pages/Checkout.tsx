import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import api from '../config/api';

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create order
      const orderItems = items.map((item) => ({
        product: item.product._id,
        variant: {
          color: item.variant.color,
          size: item.variant.size,
          price: item.variant.price,
        },
        quantity: item.quantity,
        price: item.variant.price * item.quantity,
      }));

      await api.post('/orders', {
        items: orderItems,
        shippingAddress: address,
      });

      // Clear cart and redirect to orders page
      clearCart();
      navigate('/orders');
    } catch (error: any) {
      console.error('Error creating order:', error);
      setError(error.response?.data?.message || 'Error creating order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Your cart is empty
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Please add items to your cart before checking out.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/products')}
              className="inline-block bg-blue-600 py-3 px-8 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Checkout
      </h1>

      <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        {/* Shipping form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                Street address
              </label>
              <input
                type="text"
                name="street"
                id="street"
                required
                value={address.street}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  required
                  value={address.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State / Province
                </label>
                <input
                  type="text"
                  name="state"
                  id="state"
                  required
                  value={address.state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  id="country"
                  required
                  value={address.country}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  ZIP / Postal code
                </label>
                <input
                  type="text"
                  name="zipCode"
                  id="zipCode"
                  required
                  value={address.zipCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>

        {/* Order summary */}
        <div className="mt-16 lg:mt-0 lg:col-span-5">
          <div className="bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8">
            <h2 className="text-lg font-medium text-gray-900">Order summary</h2>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div key={`${item.product._id}-${item.variant.sku}`} className="flex items-center">
                  <div className="flex-shrink-0 w-16 h-16">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full rounded-md object-center object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.variant.color} / {item.variant.size} x {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${item.variant.price * item.quantity}
                  </p>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-base font-medium text-gray-900">Subtotal</div>
                  <div className="text-base font-medium text-gray-900">${totalAmount}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-base font-medium text-gray-900">Shipping</div>
                  <div className="text-base font-medium text-gray-900">Free</div>
                </div>
                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                  <div className="text-base font-medium text-gray-900">Order total</div>
                  <div className="text-base font-medium text-gray-900">${totalAmount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 