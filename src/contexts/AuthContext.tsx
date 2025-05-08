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

// Add IndexedDB helper function
const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('zuveesDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingUpdates')) {
        db.createObjectStore('pendingUpdates', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Helper function to store token in IndexedDB
const storeTokenInIndexedDB = async (token: string) => {
  try {
    const db = await openDB();
    const store = db.transaction('auth', 'readwrite').objectStore('auth');
    await store.put({ id: 'token', token });
  } catch (error) {
    console.error('Error storing token in IndexedDB:', error);
  }
};

// Helper function to remove token from IndexedDB
const removeTokenFromIndexedDB = async () => {
  try {
    const db = await openDB();
    const store = db.transaction('auth', 'readwrite').objectStore('auth');
    await store.delete('token');
  } catch (error) {
    console.error('Error removing token from IndexedDB:', error);
  }
};

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
      storeTokenInIndexedDB(token);
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
          
          // Store token in IndexedDB
          await storeTokenInIndexedDB(token);
          
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
          await removeTokenFromIndexedDB();
        }
      } else {
        console.log('User signed out of Firebase');
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        delete api.defaults.headers.common['Authorization'];
        await removeTokenFromIndexedDB();
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