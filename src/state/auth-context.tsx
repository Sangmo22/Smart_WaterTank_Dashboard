import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const USERS_KEY = "@auth_registered_users";
const SESSION_KEY = "@auth_user_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session on startup
  useEffect(() => {
    (async () => {
      try {
        const session = await AsyncStorage.getItem(SESSION_KEY);
        if (session) {
          setUser(JSON.parse(session));
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
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users: any[] = usersJson ? JSON.parse(usersJson) : [];
      
      const normalizedUsername = username.trim().toLowerCase();
      const matchedUser = users.find(
        (u) => 
          (u.username.toLowerCase() === normalizedUsername || u.email.toLowerCase() === normalizedUsername) &&
          u.password === password
      );

      if (!matchedUser) {
        return { success: false, error: "Invalid username or password" };
      }

      const sessionUser: User = {
        username: matchedUser.username,
        email: matchedUser.email,
        provider: "local",
      };

      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: "Something went wrong during login." };
    }
  };

  // Standard username/password signup
  const signup = async (username: string, password: string, email: string) => {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users: any[] = usersJson ? JSON.parse(usersJson) : [];

      const normalizedUsername = username.trim().toLowerCase();
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user already exists
      const exists = users.some(
        (u) => u.username.toLowerCase() === normalizedUsername || u.email.toLowerCase() === normalizedEmail
      );

      if (exists) {
        return { success: false, error: "Username or Email already registered" };
      }

      // Add new user
      const newUser = {
        username: username.trim(),
        email: email.trim(),
        password,
        provider: "local" as const,
      };

      users.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      // Auto-login after registration
      const sessionUser: User = {
        username: newUser.username,
        email: newUser.email,
        provider: "local",
      };

      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { success: true };
    } catch (err) {
      console.error("Signup error:", err);
      return { success: false, error: "Something went wrong during registration." };
    }
  };

  // Google authentication
  const loginWithGoogle = async (email: string, username: string) => {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_KEY);
      const users: any[] = usersJson ? JSON.parse(usersJson) : [];
      
      const normalizedEmail = email.trim().toLowerCase();
      const defaultGoogleEmails = [
        "sangmolama29@gmail.com",
        "watertank.admin@gmail.com",
        "guest.user@gmail.com"
      ];

      const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail) ||
                     defaultGoogleEmails.includes(normalizedEmail);

      if (!exists) {
        return { success: false, error: "This Google account is not registered. Please sign up first." };
      }

      const sessionUser: User = {
        username: username.trim(),
        email: email.trim(),
        provider: "google",
      };

      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { success: true };
    } catch (err) {
      console.error("Google sign in error:", err);
      return { success: false, error: "Something went wrong during Google Sign-In." };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
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
