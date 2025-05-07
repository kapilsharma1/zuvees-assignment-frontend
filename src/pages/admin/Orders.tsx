import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { Order, User } from '../../types';

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'undelivered' | 'cancelled';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  undelivered: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusOptions = [
  'paid',
  'shipped',
  'cancelled'
] as OrderStatus[];

const AdminOrders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [showRiderPrompt, setShowRiderPrompt] = useState<string | null>(null);
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch orders
        const ordersResponse = await api.get('/orders');
        setOrders(ordersResponse.data);
        
        // Fetch riders
        const ridersResponse = await api.get('/riders');
        setRiders(ridersResponse.data);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus, riderId?: string) => {
    try {
      // If changing to shipped status and no rider is provided, show the rider prompt
      if (status === 'shipped' && !riderId && !showRiderPrompt) {
        setShowRiderPrompt(orderId);
        setSelectedRider('');
        return;
      }

      setUpdateLoading(orderId);
      
      const response = await api.patch(`/orders/${orderId}/status`, { 
        status,
        riderId: riderId || undefined
      });
      
      // Update orders list with the updated order
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { 
                ...order, 
                status, 
                rider: riderId ? { _id: riderId, name: riders.find(r => r._id === riderId)?.name || 'Unknown' } as any : order.rider 
              } 
            : order
        )
      );

      console.log('Order updated successfully:', response.data);
      
      // Clear rider prompt
      if (showRiderPrompt === orderId) {
        setShowRiderPrompt(null);
        setSelectedRider('');
      }
    } catch (error: any) {
      console.error('Error updating order:', error);
      setError(error.response?.data?.message || 'Error updating order');
    } finally {
      setUpdateLoading(null);
    }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {showRiderPrompt && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign a Rider</h3>
            <p className="text-sm text-gray-500 mb-4">
              You're changing this order to "Shipped" status. Please assign a rider for delivery.
            </p>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 mb-4"
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
            >
              <option value="" disabled>Select a rider</option>
              {riders.map((rider) => (
                <option key={rider._id} value={rider._id}>
                  {rider.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                onClick={() => setShowRiderPrompt(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={!selectedRider}
                onClick={() => {
                  if (showRiderPrompt && selectedRider) {
                    updateOrderStatus(showRiderPrompt, 'shipped', selectedRider);
                  }
                }}
              >
                Assign & Ship
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-gray-900">
                Order Details #{selectedOrder._id.slice(-6)}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Customer Information</h4>
                <p className="mt-2 text-sm text-gray-500">
                  Name: {selectedOrder.user.name}<br />
                  Email: {selectedOrder.user.email}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">Order Information</h4>
                <p className="mt-2 text-sm text-gray-500">
                  Date: {new Date(selectedOrder.createdAt).toLocaleString()}<br />
                  Status: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </p>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-900">Shipping Address</h4>
                <p className="mt-2 text-sm text-gray-500">
                  {selectedOrder.shippingAddress.street}<br />
                  {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}<br />
                  {selectedOrder.shippingAddress.country}
                </p>
              </div>

              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Order Items</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variant
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={`${item.product._id}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium">{item.product.name}</div>
                                <div className="text-gray-500">{item.product.category}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.variant.color} / {item.variant.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${item.variant.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${(item.variant.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          Total Amount:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${selectedOrder.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            All Orders
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A detailed view of all orders in the system.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Order ID
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Items
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Rider
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        #{order._id.slice(-6)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.user.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.items.length} item(s)
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <select
                          className={`rounded-md border border-gray-300 px-2 py-1 text-sm w-28 ${
                            statusColors[order.status as keyof typeof statusColors]
                          }`}
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value as OrderStatus)}
                          disabled={updateLoading === order._id || showRiderPrompt === order._id}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <select 
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm w-40"
                          value={order.rider?._id || ""}
                          onChange={(e) => {
                            // When changing rider, set status to shipped if not already
                            const newStatus = order.status === 'pending' || order.status === 'paid' 
                              ? 'shipped' 
                              : order.status;
                            updateOrderStatus(order._id, newStatus as OrderStatus, e.target.value);
                          }}
                          disabled={updateLoading === order._id || showRiderPrompt === order._id}
                        >
                          <option value="">Not assigned</option>
                          {riders.map((rider) => (
                            <option key={rider._id} value={rider._id}>
                              {rider.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {updateLoading === order._id ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 text-xs">
                            Updating...
                          </span>
                        ) : (
                          <button
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            onClick={() => setSelectedOrder(order)}
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders; 