import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  resolveUserAddressing,
  setActiveUser,
  UserGender,
} from "../utils/genderHelper";

interface UserProfile {
  email: string;
  role: "admin" | "user";
  displayName: string;
  photoURL?: string | null;
}

const AuthContext = createContext<{
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authReady: boolean;
  userName: string;
  userGender: UserGender;
}>({
  user: null,
  profile: null,
  loading: true,
  authReady: false,
  userName: "ضيف",
  userGender: "neutral",
});

const ADMIN_EMAILS = new Set([
  "ah_f@hotmail.com",
  "alfailakawidrahmad@gmail.com",
  "dr.ahmad@gmail.com",
  "dr.ahmad.alfailakawi@gmail.com",
]);

const isAdminUser = (user: User) =>
  user.uid === "VfYbpLBoYFQGoVyBVOlMfVCESdm1" ||
  ADMIN_EMAILS.has(user.email?.toLowerCase() || "");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userName, setUserName] = useState<string>("ضيف");
  const [userGender, setUserGender] = useState<UserGender>("neutral");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const startAuth = async () => {
      try {
        // Firebase is intentionally loaded after the first UI paint. Guests can
        // start typing immediately while the saved session restores quietly.
        const [{ auth, db }, authApi, firestore] = await Promise.all([
          import("../lib/firebase"),
          import("firebase/auth"),
          import("firebase/firestore"),
        ]);

        if (cancelled) return;

        unsubscribe = authApi.onAuthStateChanged(auth, async (nextUser) => {
          if (cancelled) return;
          setAuthReady(true);
          setUser(nextUser);

          if (!nextUser) {
            setProfile(null);
            setLoading(false);
            return;
          }

          const admin = isAdminUser(nextUser);
          const fallbackProfile: UserProfile = {
            email: nextUser.email || "",
            role: admin ? "admin" : "user",
            displayName: nextUser.displayName || "New User",
            photoURL: nextUser.photoURL || null,
          };

          try {
            const userRef = firestore.doc(db, "users", nextUser.uid);
            const userSnap = await firestore.getDoc(userRef);
            let profileData: UserProfile = userSnap.exists()
              ? (userSnap.data() as UserProfile)
              : fallbackProfile;

            if (admin) {
              profileData = { ...profileData, role: "admin" };
              try {
                const adminRef = firestore.doc(db, "admins", nextUser.uid);
                const adminSnap = await firestore.getDoc(adminRef);
                if (!adminSnap.exists()) {
                  await firestore.setDoc(adminRef, {
                    email: nextUser.email,
                    registeredAt: firestore.serverTimestamp(),
                    source: userSnap.exists()
                      ? "self-registration"
                      : "self-registration-new",
                  });
                }
              } catch (adminError) {
                console.warn("Admin self-registration failed:", adminError);
              }
            }

            if (
              !userSnap.exists() ||
              (admin && userSnap.data().role !== "admin")
            ) {
              try {
                await firestore.setDoc(
                  userRef,
                  userSnap.exists()
                    ? { ...profileData, role: profileData.role }
                    : {
                        ...profileData,
                        createdAt: firestore.serverTimestamp(),
                      },
                  userSnap.exists() ? { merge: true } : undefined,
                );
              } catch (writeError) {
                console.warn("User profile sync failed:", writeError);
              }
            }

            if (!cancelled) setProfile(profileData);
          } catch (error) {
            console.error(
              "Failed to fetch user profile, using local account details:",
              error,
            );
            if (!cancelled) setProfile(fallbackProfile);
          } finally {
            if (!cancelled) setLoading(false);
          }
        });
      } catch (error) {
        console.error("Authentication initialization failed:", error);
        if (!cancelled) {
          setAuthReady(true);
          setLoading(false);
          setUser(null);
          setProfile(null);
        }
      }
    };

    const win = window as typeof window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout?: number },
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    let timerId: number | undefined;
    const launch = () => void startAuth();

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(launch, {
        timeout: window.matchMedia("(max-width: 767px)").matches ? 1800 : 900,
      });
    } else {
      timerId = window.setTimeout(
        launch,
        window.matchMedia("(max-width: 767px)").matches ? 900 : 350,
      );
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (idleId !== undefined) win.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const addressing = resolveUserAddressing(
        profile?.displayName || user.displayName || "ضيف",
      );
      setUserName(addressing.name);
      setUserGender(addressing.gender);
      setActiveUser(addressing.name, addressing.gender);
    } else {
      const guestAddressing = resolveUserAddressing("ضيف", true);
      setUserName(guestAddressing.name);
      setUserGender(guestAddressing.gender);
      setActiveUser(guestAddressing.name, guestAddressing.gender);
    }
  }, [user, profile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, authReady, userName, userGender }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
