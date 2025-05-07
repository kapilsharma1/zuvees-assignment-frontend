import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../config/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUserManually: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage if available
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('Loaded user data from localStorage:', userData);
        setUser(userData);
      } catch (err) {
        console.error('Failed to parse saved user data:', err);
        localStorage.removeItem('userData');
      }
    }
  }, []);

  useEffect(() => {
    // Set up authorization header from localStorage if available
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('Setting auth token from localStorage');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('Firebase auth state changed:', firebaseUser?.email);
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get a fresh token and set it in localStorage and API headers
          const token = await firebaseUser.getIdToken();
          console.log('Got fresh token from Firebase');
          localStorage.setItem('authToken', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data from our backend
          console.log('Fetching user data from /auth/me endpoint');
          const response = await api.get('/auth/me');
          console.log('User data fetched successfully:', response.data);
          
          // Store the user data
          setUser(response.data);
          localStorage.setItem('userData', JSON.stringify(response.data));
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
      } else {
        console.log('User signed out of Firebase');
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        delete api.defaults.headers.common['Authorization'];
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setUserManually = (userData: User) => {
    console.log('Setting user manually:', userData);
    setUser(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      await auth.signOut();
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      delete api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      loading, 
      signIn, 
      signOut,
      setUserManually 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 