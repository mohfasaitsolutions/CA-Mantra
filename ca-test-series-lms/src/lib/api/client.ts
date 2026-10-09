import axios from 'axios';

// Resolve base URL from env (support both Vite-style and legacy key for flexibility)
// Support multiple env var names (prefer Vite-prefixed). Any non-prefixed key must be accessed via cast.
const baseURL =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  ((import.meta as unknown as { env?: Record<string, string> }).env?.API_BASE) ||
  'http://localhost:3000/api';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage or other storage
    const token = localStorage.getItem('ca-prep-auth-storage');
    
    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        if (parsedToken.state && parsedToken.state.token) {
          config.headers.Authorization = `Bearer ${parsedToken.state.token}`;
          console.log('Request with auth token:', {
            url: config.url,
            method: config.method,
            hasToken: !!parsedToken.state.token
          });
        } else {
          console.warn('No token found in auth storage state');
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
      }
    } else {
      console.warn('No auth token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 413 Payload Too Large errors
    if (error.response && error.response.status === 413) {
      error.message = 'File size too large. Please reduce the file size and try again. Maximum allowed size is 20MB per file.';
      return Promise.reject(error);
    }
    
    // Handle common errors like 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized - clearing auth data');
      
      // Don't auto-redirect if this is a login/auth attempt
      // Let the login page handle the error gracefully
      const isAuthEndpoint = error.config?.url?.includes('/auth/signin') || 
                            error.config?.url?.includes('/auth/signup') ||
                            error.config?.url?.includes('/auth/login');
      
      if (!isAuthEndpoint) {
        // Only clear auth data and redirect for non-auth endpoints
        // dispatch custom event so the React application can gracefully handle it without a hard reload loss
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
      // For auth endpoints, let the calling code handle the error
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;