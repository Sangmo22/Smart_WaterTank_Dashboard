import { Platform } from 'react-native';

// For local development
const DEV_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000' 
  : 'http://localhost:5000';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || DEV_API_URL;
