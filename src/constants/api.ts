import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determine the local development API URL dynamically
const getDevApiUrl = () => {
  // If running in browser/web, use the current host (works for local network access)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000`;
  }

  // If running on a native device (Expo Go or development build),
  // extract the development machine's IP address from expo-constants
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:5000`;
  }

  // Fallbacks for emulators
  return Platform.OS === 'android' 
    ? 'http://10.0.2.2:5000' 
    : 'http://localhost:5000';
};

const DEV_API_URL = getDevApiUrl();

export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;
