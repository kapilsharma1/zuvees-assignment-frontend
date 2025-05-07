import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import { User, Order } from '../../types';

interface RiderWithOrders extends User {
  orders?: Order[];
  showOrders?: boolean;
  activeOrdersCount?: number;
}

const AdminRiders: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [riders, setRiders] = useState<RiderWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [orderLoading] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all riders
        const ridersResponse = await api.get('/riders');
        
        // Fetch all orders in one request to count active orders per rider
        const ordersResponse = await api.get('/orders');
        const fetchedOrders = ordersResponse.data;
        setAllOrders(fetchedOrders);
        
        // Process rider data and count active orders
        const ridersData = ridersResponse.data.map((rider: User) => {
          // Filter orders for this rider
          const riderOrders = fetchedOrders.filter(
            (order: Order) => order.rider && order.rider._id === rider._id
          );
          
          // Count active orders (shipped status)
          const activeOrdersCount = riderOrders.filter(
            (order: Order) => order.status === 'shipped'
          ).length;
          
          return {
            ...rider,
            showOrders: false,
            orders: [],
            activeOrdersCount
          };
        });
        
        setRiders(ridersData);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.response?.data?.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const toggleOrdersView = (riderId: string) => {
    setRiders(prevRiders => 
      prevRiders.map(rider => {
        if (rider._id === riderId) {
          // If we're showing orders and they haven't been loaded yet, load them
          if (!rider.showOrders && (!rider.orders || rider.orders.length === 0)) {
            const riderOrders = allOrders.filter(
              (order: Order) => order.rider && order.rider._id === riderId
            );
            return { ...rider, showOrders: true, orders: riderOrders };
          }
          // Otherwise just toggle the showOrders flag
          return { ...rider, showOrders: !rider.showOrders };
        }
        return rider;
      })
    );
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
            Riders
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all riders with their assigned orders and performance.
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
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Email
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
                      Active Orders
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
                  {riders.map((rider) => (
                    <React.Fragment key={rider._id}>
                      <tr>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          #{rider._id.slice(-6)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {rider.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {rider.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              'bg-green-100 text-green-800'
                            }`}
                          >
                            {'Active'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {rider.activeOrdersCount || 0}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <button
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            onClick={() => toggleOrdersView(rider._id)}
                            disabled={orderLoading === rider._id}
                          >
                            {orderLoading === rider._id ? (
                              'Loading...'
                            ) : rider.showOrders ? (
                              'Hide Orders'
                            ) : (
                              'View Orders'
                            )}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expandable row for orders */}
                      {rider.showOrders && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-sm text-gray-500 bg-gray-50">
                            <div className="p-4">
                              <h3 className="text-md font-semibold mb-2">
                                Orders Assigned to {rider.name}
                              </h3>
                              
                              {rider.orders && rider.orders.length > 0 ? (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                  <ul className="divide-y divide-gray-200">
                                    {rider.orders.map((order) => (
                                      <li key={order._id}>
                                        <div className="px-4 py-4 flex items-center sm:px-6">
                                          <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                              <div className="flex text-sm">
                                                <p className="font-medium text-blue-600 truncate">
                                                  Order #{order._id.slice(-6)}
                                                </p>
                                                <p className="ml-1 flex-shrink-0 font-normal text-gray-500">
                                                  {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                              </div>
                                              <div className="mt-2 flex">
                                                <div className="flex items-center text-sm text-gray-500">
                                                  <p>
                                                    Customer: {order.user.name} | Items: {order.items.length} | 
                                                    Total: ${order.totalAmount.toFixed(2)}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                            <div className="mt-4 flex-shrink-0 sm:mt-0">
                                              <div className="flex overflow-hidden">
                                                <span
                                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${order.status === 'shipped' ? 'bg-purple-100 text-purple-800' : 
                                                      order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                                      order.status === 'undelivered' ? 'bg-red-100 text-red-800' : 
                                                      'bg-blue-100 text-blue-800'}`}
                                                >
                                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-gray-500">No orders assigned to this rider.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

export default AdminRiders; 