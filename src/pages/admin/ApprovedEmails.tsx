import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

interface ApprovedEmail {
  _id: string;
  email: string;
  role: 'customer' | 'admin' | 'rider';
  createdAt: string;
}

const AdminApprovedEmails: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [approvedEmails, setApprovedEmails] = useState<ApprovedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'customer' | 'admin' | 'rider'>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchApprovedEmails();
  }, [user, navigate]);

  const fetchApprovedEmails = async () => {
    try {
      setLoading(true);
      const response = await api.get('/approved-emails');
      setApprovedEmails(response.data);
    } catch (error: any) {
      console.error('Error fetching approved emails:', error);
      setError(error.response?.data?.message || 'Error fetching approved emails');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post('/approved-emails', {
        email: newEmail,
        role: newRole
      });

      setApprovedEmails([response.data, ...approvedEmails]);
      setNewEmail('');
      setNewRole('customer');
      setError('');
    } catch (error: any) {
      console.error('Error adding approved email:', error);
      setError(error.response?.data?.message || 'Error adding approved email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmail = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this approved email?')) {
      return;
    }

    try {
      await api.delete(`/approved-emails/${id}`);
      setApprovedEmails(approvedEmails.filter(email => email._id !== id));
    } catch (error: any) {
      console.error('Error deleting approved email:', error);
      setError(error.response?.data?.message || 'Error deleting approved email');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Approved Emails
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage emails that are allowed to register with specific roles.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-8 bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Add New Approved Email</h2>
          <form className="mt-4 flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4" onSubmit={handleAddEmail}>
            <div className="flex-grow">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
              >
                <option value="customer">Customer</option>
                <option value="rider">Rider</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Email'}
              </button>
            </div>
          </form>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Approved Emails</h3>
          {approvedEmails.length === 0 ? (
            <p className="text-gray-500">No approved emails yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {approvedEmails.map((email) => (
                    <tr key={email._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {email.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${email.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                              email.role === 'rider' ? 'bg-blue-100 text-blue-800' : 
                              'bg-green-100 text-green-800'}`}
                        >
                          {email.role.charAt(0).toUpperCase() + email.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(email.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteEmail(email._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApprovedEmails; 