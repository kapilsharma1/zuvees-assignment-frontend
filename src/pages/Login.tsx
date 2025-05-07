import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';

const Login: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user, setUserManually } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      console.log("User is already logged in, redirecting to appropriate page", user);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'rider') {
        navigate('/rider');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign-in successful with user:", result.user.email);
      
      // Get Firebase token
      const token = await result.user.getIdToken();
      console.log("Got Firebase token");
      
      // Register the user with our backend using the new endpoint
      try {
        console.log("Calling register-initial API endpoint");
        const response = await fetch('http://localhost:5000/api/auth/register-initial', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        });
        
        // Log the raw response for debugging
        const responseText = await response.text();
        console.log("Raw API response:", responseText);
        
        if (!response.ok) {
          console.error("Backend registration failed:", response.status, responseText);
          setError(`Registration failed: ${response.status} ${responseText}`);
          return;
        }
        
        // Parse response to get user data (need to parse manually since we already read the text)
        let data;
        try {
          data = JSON.parse(responseText);
          console.log("Parsed API response data:", data);
        } catch (err) {
          console.error("Failed to parse JSON response:", err);
          setError("Failed to parse server response");
          return;
        }
        
        // Create a user object from the response data
        // Check if response format has user property directly or contains user details at the top level
        const userData = data.user || {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role
        };

        // If we have user data, proceed with login
        if (userData && userData.email) {
          console.log("Setting auth token and user data", userData);
          // Set the token for API calls
          localStorage.setItem('authToken', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Set the user manually in the auth context
          setUserManually(userData);
          
          // Navigate based on role
          const role = userData.role;
          console.log(`User role is ${role}, navigating to appropriate page`);
          
          if (role === 'admin') {
            navigate('/admin');
          } else if (role === 'rider') {
            navigate('/rider');
          } else {
            navigate('/');
          }
        } else {
          console.error("No valid user data in response", data);
          setError("Invalid user data received from server");
        }
      } catch (fetchError: any) {
        console.error("Fetch error during registration:", fetchError);
        setError(`Network error during registration: ${fetchError.message}`);
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {loading ? 'Processing...' : 'Sign in to continue'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 