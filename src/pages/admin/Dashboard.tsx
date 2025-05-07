import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { Order, User } from '../../types';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  undelivered: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedRider, setSelectedRider] = useState<string>('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersResponse, ridersResponse] = await Promise.all([
          api.get('/orders'),
          api.get('/riders'),
        ]);
        setOrders(ordersResponse.data);
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

  // const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
  //   try {
  //     await api.patch(`/orders/${orderId}`, { status: newStatus });
  //     setOrders((prevOrders) =>
  //       prevOrders.map((order) =>
  //         order._id === orderId ? { ...order, status: newStatus } : order
  //       )
  //     );
  //   } catch (error: any) {
  //     console.error('Error updating order status:', error);
  //     setError(error.response?.data?.message || 'Error updating order status');
  //   }
  // };

  const handleAssignRider = async () => {
    if (!selectedOrder || !selectedRider) return;

    try {
      await api.patch(`/orders/${selectedOrder._id}`, {
        status: 'shipped' as const,
        rider: selectedRider,
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === selectedOrder._id
            ? {
                ...order,
                status: 'shipped',
                rider: riders.find((r) => r._id === selectedRider),
              }
            : order
        )
      );

      setSelectedOrder(null);
      setSelectedRider('');
    } catch (error: any) {
      console.error('Error assigning rider:', error);
      setError(error.response?.data?.message || 'Error assigning rider');
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
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage orders and assign riders for delivery.
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
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Rider
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
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusColors[order.status]
                              }`}
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            
                            {/* {order.status === 'paid' && (
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="ml-2 text-blue-600 hover:text-blue-900 text-xs"
                              >
                                Assign Rider
                              </button>
                            )} */}
                          </div>
                        
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {order.rider ? order.rider.name : 'Not assigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Rider Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Rider to Order #{selectedOrder._id.slice(-6)}
            </h3>
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select a rider</option>
              {riders.map((rider) => (
                <option key={rider._id} value={rider._id}>
                  {rider.name}
                </option>
              ))}
            </select>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setSelectedRider('');
                }}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRider}
                disabled={!selectedRider}
                className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 