import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  email: string;
  role: 'admin' | 'user';
  displayName: string;
  photoURL?: string | null;
}

const AuthContext = createContext<{ 
  user: User | null; 
  profile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
}>({ user: null, profile: null, loading: true, authReady: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Safety timeout: stop loading after 10 seconds even if Firebase hangs
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth initialization timed out, forcing loading false");
        setLoading(false);
        setAuthReady(true);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Mark auth as ready (onAuthStateChanged fired)
      setAuthReady(true);
      
      setUser(user);
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const profileData = userSnap.data() as UserProfile;
            const isAdminEmail = user.email?.toLowerCase() === 'alfailakawidrahmad@gmail.com' || user.email?.toLowerCase() === 'dr.ahmad.alfailakawi@gmail.com';
            if (isAdminEmail) {
              profileData.role = 'admin';
              if (userSnap.data().role !== 'admin') {
                try {
                  await setDoc(userRef, { ...profileData, role: 'admin' });
                  console.log("Admin role updated successfully");
                } catch (error) {
                  console.error("Failed to update admin role:", error);
                }
              }
            }
            setProfile(profileData);
          } else {
            const newProfile: UserProfile = {
              email: user.email || '',
              role: (user.email?.toLowerCase() === 'alfailakawidrahmad@gmail.com' || user.email?.toLowerCase() === 'dr.ahmad.alfailakawi@gmail.com') ? 'admin' : 'user',
              displayName: user.displayName || 'New User',
              photoURL: user.photoURL || null
            };
            try {
              await setDoc(userRef, { ...newProfile, createdAt: serverTimestamp() });
              setProfile(newProfile);
            } catch (error) {
              console.error("Failed to initialize user profile:", error);
              setProfile(newProfile); // Still set profile even if DB write fails
            }
          }
        } catch (error) {
          console.error("Failed to fetch user profile, falling back to local info:", error);
          setProfile({
            email: user.email || '',
            role: (user.email?.toLowerCase() === 'alfailakawidrahmad@gmail.com' || user.email?.toLowerCase() === 'dr.ahmad.alfailakawi@gmail.com') ? 'admin' : 'user',
            displayName: user.displayName || 'New User',
            photoURL: user.photoURL || null
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      clearTimeout(timeout);
    });
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, authReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
