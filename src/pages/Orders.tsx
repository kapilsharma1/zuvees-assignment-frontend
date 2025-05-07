import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { Order } from '../types';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  undelivered: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/my-orders');
        setOrders(response.data);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError(error.response?.data?.message || 'Error fetching orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            No orders yet
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Start shopping to see your orders here.
          </p>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-block bg-blue-600 py-3 px-8 border border-transparent rounded-md text-base font-medium text-white hover:bg-blue-700"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
        Order History
      </h1>

      <div className="mt-12 space-y-8">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Order #{order._id.slice(-6)}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
                  statusColors[order.status]
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Shipping address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {order.shippingAddress.street}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.zipCode}
                    <br />
                    {order.shippingAddress.country}
                  </dd>
                </div>

                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Items</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {order.items.map((item) => (
                        <li
                          key={`${item.product._id}-${item.variant.color}-${item.variant.size}`}
                          className="pl-3 pr-4 py-3 flex items-center justify-between text-sm"
                        >
                          <div className="w-0 flex-1 flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            </div>
                            <div className="ml-4 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {item.product.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {item.variant.color} / {item.variant.size} x {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <p className="text-sm font-medium text-gray-900">
                              ${item.price}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>

                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Total amount</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    ${order.totalAmount}
                  </dd>
                </div>

                {order.rider && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Delivery rider</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {order.rider.name}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders; 