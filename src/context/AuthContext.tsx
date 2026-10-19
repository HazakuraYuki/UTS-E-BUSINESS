import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../services/seedService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoPersona: (role: UserRole) => void;
  isDemoUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'harrypottermacig@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsDemoUser(false);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);

          let role: UserRole = 'sender';
          if (currentUser.email === ADMIN_EMAIL) {
            role = 'admin';
          }

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            // Retain admin privilege for configured admin
            if (currentUser.email === ADMIN_EMAIL) {
              data.role = 'admin';
            }
            setProfile(data);
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Pengguna',
              role,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        setUser(null);
        // If not using demo persona, clear profile
        setProfile((prev) => (isDemoUser ? prev : null));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const isSystemAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const newProfile: UserProfile = {
        uid: res.user.uid,
        email: res.user.email || email,
        displayName: name,
        phone,
        role: isSystemAdmin ? 'admin' : 'sender', // Public registration default is strictly sender
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', res.user.uid), newProfile);
      setProfile(newProfile);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const isSystemAdmin = res.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const userDocRef = doc(db, 'users', res.user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        const newProfile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email || '',
          displayName: res.user.displayName || 'Pengguna Google',
          role: isSystemAdmin ? 'admin' : 'sender',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (user) {
        await fbSignOut(auth);
      }
      setUser(null);
      setProfile(null);
      setIsDemoUser(false);
    } finally {
      setLoading(false);
    }
  };

  const switchDemoPersona = (targetRole: UserRole) => {
    const demo = DEMO_USERS.find((d) => d.role === targetRole) || DEMO_USERS[0];
    setProfile(demo);
    setIsDemoUser(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        switchDemoPersona,
        isDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
