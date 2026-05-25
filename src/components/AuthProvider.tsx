import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { detectGender, setActiveUser } from '../utils/genderHelper';

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
  userName: string;
  userGender: 'male' | 'female' | 'neutral';
}>({ 
  user: null, 
  profile: null, 
  loading: true, 
  authReady: false,
  userName: 'ضيف',
  userGender: 'neutral'
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  
  const [userName, setUserName] = useState<string>('ضيف');
  const [userGender, setUserGender] = useState<'male' | 'female' | 'neutral'>('neutral');

  useEffect(() => {
    // We removed the aggressive 10s timeout here to avoid logging out users on slow PWA wakeups.
    // Firebase will guarantee `onAuthStateChanged` fires when local persistence is resolved.

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthReady(true);
      setUser(user);
      
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const profileData = userSnap.data() as UserProfile;
            const isAdminEmail = user.uid === 'VfYbpLBoYFQGoVyBVOlMfVCESdm1' || [
              'ah_f@hotmail.com',
              'alfailakawidrahmad@gmail.com',
              'dr.ahmad@gmail.com',
              'dr.ahmad.alfailakawi@gmail.com'
            ].includes(user.email?.toLowerCase() || '');
            if (isAdminEmail) {
              profileData.role = 'admin';
              
              // Self-register in admins collection for reliable firestore rules check
              try {
                const adminRef = doc(db, 'admins', user.uid);
                const adminSnap = await getDoc(adminRef);
                if (!adminSnap.exists()) {
                  await setDoc(adminRef, { 
                    email: user.email, 
                    registeredAt: serverTimestamp(),
                    source: 'self-registration'
                  });
                  console.log("Admin self-registration successful");
                }
              } catch (adminErr) {
                console.warn("Admin self-registration failed:", adminErr);
              }

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
            const isNewAdminEmail = user.uid === 'VfYbpLBoYFQGoVyBVOlMfVCESdm1' || ([
                'ah_f@hotmail.com',
                'alfailakawidrahmad@gmail.com',
                'dr.ahmad@gmail.com',
                'dr.ahmad.alfailakawi@gmail.com'
              ].includes(user.email?.toLowerCase() || ''));
            
            const newProfile: UserProfile = {
              email: user.email || '',
              role: isNewAdminEmail ? 'admin' : 'user',
              displayName: user.displayName || 'New User',
              photoURL: user.photoURL || null
            };

            if (isNewAdminEmail) {
              try {
                const adminRef = doc(db, 'admins', user.uid);
                await setDoc(adminRef, { 
                  email: user.email, 
                  registeredAt: serverTimestamp(),
                  source: 'self-registration-new'
                });
                console.log("New Admin self-registration successful");
              } catch (adminErr) {
                console.warn("New Admin self-registration failed:", adminErr);
              }
            }

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
          const isAdminEmail = user.uid === 'VfYbpLBoYFQGoVyBVOlMfVCESdm1' || [
            'ah_f@hotmail.com',
            'alfailakawidrahmad@gmail.com',
            'dr.ahmad@gmail.com',
            'dr.ahmad.alfailakawi@gmail.com'
          ].includes(user.email?.toLowerCase() || '');

          setProfile({
            email: user.email || '',
            role: isAdminEmail ? 'admin' : 'user',
            displayName: user.displayName || 'New User',
            photoURL: user.photoURL || null
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const name = profile?.displayName || user.displayName || 'ضيف';
      const cleanName = name && name !== 'New User' && name !== 'ضيف' ? name : '';
      const finalName = cleanName || 'ضيف';
      const gender = cleanName ? detectGender(cleanName) : 'neutral';
      
      setUserName(finalName);
      setUserGender(gender);
      setActiveUser(finalName, gender);
    } else {
      setUserName('ضيف');
      setUserGender('neutral');
      setActiveUser('ضيف', 'neutral');
    }
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, authReady, userName, userGender }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
