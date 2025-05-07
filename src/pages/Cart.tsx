import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { TrashIcon } from '@heroicons/react/24/outline';

const Cart: React.FC = () => {
  const { items, removeItem, updateQuantity, totalAmount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Your cart is empty
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Looks like you haven't added any items to your cart yet.
          </p>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-block bg-blue-600 py-3 px-8 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Shopping Cart
      </h1>

      <div className="mt-12 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <div className="lg:col-span-7">
          <ul className="border-t border-b border-gray-200 divide-y divide-gray-200">
            {items.map((item) => (
              <li key={`${item.product._id}-${item.variant.sku}`} className="flex py-6 sm:py-10">
                <div className="flex-shrink-0">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-24 h-24 rounded-md object-center object-cover sm:w-32 sm:h-32"
                  />
                </div>

                <div className="ml-4 flex-1 flex flex-col sm:ml-6">
                  <div>
                    <div className="flex justify-between">
                      <h4 className="text-sm">
                        <Link
                          to={`/products/${item.product._id}`}
                          className="font-medium text-gray-700 hover:text-gray-800"
                        >
                          {item.product.name}
                        </Link>
                      </h4>
                      <p className="ml-4 text-sm font-medium text-gray-900">
                        ${item.variant.price * item.quantity}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.variant.color} / {item.variant.size}
                    </p>
                  </div>

                  <div className="mt-4 flex-1 flex items-end justify-between">
                    <div className="flex items-center">
                      <label htmlFor={`quantity-${item.variant.sku}`} className="mr-2 text-sm text-gray-500">
                        Qty
                      </label>
                      <select
                        id={`quantity-${item.variant.sku}`}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.product._id,
                            { color: item.variant.color, size: item.variant.size },
                            Number(e.target.value)
                          )
                        }
                        className="rounded-md border-gray-300 py-1.5 text-base leading-5 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.product._id, {
                          color: item.variant.color,
                          size: item.variant.size,
                        })
                      }
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Order summary */}
        <div className="mt-16 lg:mt-0 lg:col-span-5">
          <div className="bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8">
            <h2 className="text-lg font-medium text-gray-900">Order summary</h2>
            <div className="mt-6 space-y-4">
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

            <div className="mt-6">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart; 