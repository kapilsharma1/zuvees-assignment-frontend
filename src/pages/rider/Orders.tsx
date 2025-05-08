import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { Order } from '../../types';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  undelivered: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

interface PendingUpdate {
  id?: number;
  orderId: string;
  status: Order['status'];
  timestamp: string;
}

interface CustomIDBDatabase extends IDBDatabase {
  add(storeName: string, data: any): Promise<number>;
  delete(storeName: string, key: number): Promise<void>;
  getAll(storeName: string): Promise<PendingUpdate[]>;
}

const statusOptions: Record<Order['status'], string> = {
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  undelivered: 'Undelivered',
  cancelled: 'Cancelled'
};

const RiderOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!user || user.role !== 'rider') {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/rider-orders');
        setOrders(response.data);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError(error.response?.data?.message || 'Error fetching orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Store the update in IndexedDB first
      const db = await openDB() as unknown as CustomIDBDatabase;
      const store = db.transaction('pendingUpdates', 'readwrite').objectStore('pendingUpdates');
      await store.add({
        orderId,
        status: newStatus,
        timestamp: new Date().toISOString()
      });

      // Try to update the server
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        // If offline, register for background sync
        if (!navigator.onLine) {
          if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            await (registration as any).sync.register('order-status-update');
          }
          // Update local state optimistically
          setOrders(prevOrders => prevOrders.map(order => 
            order._id === orderId ? { ...order, status: newStatus } : order
          ));
          return;
        }
        throw new Error('Failed to update order status');
      }

      // If online and update successful, remove from IndexedDB
      const deleteStore = db.transaction('pendingUpdates', 'readwrite').objectStore('pendingUpdates');
      await deleteStore.delete(orderId);
      
      // Update local state
      setOrders(prevOrders => prevOrders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      // If offline, the update will be synced when back online
      if (!navigator.onLine) {
        setOrders(prevOrders => prevOrders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        setError('Failed to update order status. Please try again.');
      }
    }
  };

  // Add IndexedDB helper function
  const openDB = () => {
    return new Promise<CustomIDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('zuveesDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as unknown as CustomIDBDatabase);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('pendingUpdates')) {
          db.createObjectStore('pendingUpdates', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

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
            No orders assigned
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            You don't have any orders assigned to you yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            My Orders
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            View detailed information about your assigned orders.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 flex flex-col h-[400px]"
          >
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Order #{order._id.slice(-6)}
                </h3>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[order.status]
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6 flex-grow overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                  <p className="mt-1 text-sm text-gray-900">{order.user.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Shipping Address</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {order.shippingAddress.street}
                    <br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    <br />
                    {order.shippingAddress.country}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Total Items</h4>
                  <p className="mt-1 text-sm text-gray-900">{order.items.length} items</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-4 sm:px-6 mt-auto border-t border-gray-200">
              <button
                onClick={() => setSelectedOrder(order)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Order Details #{selectedOrder._id.slice(-6)}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
              {selectedOrder.status === 'shipped' ? (
                <div className="mt-1">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value as Order['status'])}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {Object.entries(statusOptions).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[selectedOrder.status]
                  }`}
                >
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Customer</h4>
                <p className="text-sm text-gray-900">{selectedOrder.user.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Order Date</h4>
                <p className="text-sm text-gray-900">
                  {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Shipping Address</h4>
                <p className="text-sm text-gray-900">
                  {selectedOrder.shippingAddress.street}
                  <br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                  {selectedOrder.shippingAddress.zipCode}
                  <br />
                  {selectedOrder.shippingAddress.country}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Total Amount</h4>
                <p className="text-sm text-gray-900">${selectedOrder.totalAmount}</p>
              </div>
            </div>

            <h4 className="text-sm font-medium text-gray-500 mb-2">Items</h4>
            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200 mb-6">
              {selectedOrder.items.map((item) => (
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
                      <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.variant.color} / {item.variant.size} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">${item.price}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderOrders; 