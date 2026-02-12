"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  sendEmailOTP: (email: string) => Promise<void>;
  completeEmailSignIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const sendEmailOTP = async (email: string) => {
    const actionCodeSettings = {
      url: typeof window !== "undefined" ? window.location.origin + "/auth/verify" : "",
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("emailForSignIn", email);
    }
  };

  const completeEmailSignIn = async (email: string) => {
    if (typeof window !== "undefined" && isSignInWithEmailLink(auth, window.location.href)) {
      await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem("emailForSignIn");
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        sendEmailOTP,
        completeEmailSignIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
