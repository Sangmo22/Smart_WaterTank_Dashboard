import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/constants/api";

export interface User {
  username: string;
  email: string;
  provider: "local" | "google";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, password: string, email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "@auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on startup
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          // Validate token with backend
          const res = await fetch(`${API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.user) {
              setUser(data.user);
            } else {
              // Token invalid
              await AsyncStorage.removeItem(TOKEN_KEY);
            }
          } else {
            // Server error or invalid token
            await AsyncStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch (err) {
        console.error("Failed to load auth session:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Standard username/password login
  const login = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Invalid username or password" };
      }

      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: "Unable to connect to authentication server." };
    }
  };

  // Standard username/password signup
  const signup = async (username: string, password: string, email: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Registration failed." };
      }

      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error("Signup error:", err);
      return { success: false, error: "Unable to connect to authentication server." };
    }
  };

  // Google authentication
  const loginWithGoogle = async (email: string, username: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, name: username }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Google Sign-In failed." };
      }

      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      console.error("Google sign in error:", err);
      return { success: false, error: "Unable to connect to authentication server." };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, loginWithGoogle, logout }}>
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

