/* global chrome */
// Authentication module for extension

const AUTH_STORAGE_KEY = 'auth_user';
const API_BASE_URL = 'https://browserbaba.vercel.app';

class AuthManager {
  constructor() {
    this.user = null;
    this.listeners = [];
  }

  // Initialize auth state from storage
  async init() {
    try {
      const result = await chrome.storage.local.get(AUTH_STORAGE_KEY);
      if (result[AUTH_STORAGE_KEY]) {
        this.user = result[AUTH_STORAGE_KEY];
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }

  // Subscribe to auth state changes
  subscribe(callback) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.user);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notify all listeners of auth state change
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.user;
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Get user ID
  getUserId() {
    return this.user?.id || null;
  }

  // Verify session with backend
  async verifySession() {
    try {
      // Get session cookies from the domain
      const cookies = await chrome.cookies.getAll({
        domain: '.vercel.app' // This will match browserbaba.vercel.app and subdomains
      });

      // Find the session cookie (better-auth typically uses a name like synapse.session.token)
      const sessionCookie = cookies.find(cookie => 
        cookie.name.includes('session') && cookie.name.includes('synapse')
      );

      // Build cookie header
      const cookieHeader = cookies
        .filter(c => c.domain.includes('browserbaba') || c.domain.includes('vercel.app'))
        .map(c => `${c.name}=${c.value}`)
        .join('; ');

      const headers = {
        'Content-Type': 'application/json',
      };

      // Add cookies to header if available
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
        headers: headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          await this.setUser(data.user);
          return true;
        }
      }
      
      // If verification fails, clear user
      await this.clearUser();
      return false;
    } catch (error) {
      console.error('Error verifying session:', error);
      await this.clearUser();
      return false;
    }
  }

  // Set user and persist to storage
  async setUser(user) {
    this.user = user;
    await chrome.storage.local.set({ [AUTH_STORAGE_KEY]: user });
    this.notifyListeners();
  }

  // Clear user and storage
  async clearUser() {
    this.user = null;
    await chrome.storage.local.remove(AUTH_STORAGE_KEY);
    this.notifyListeners();
  }

  // Sign out
  async signOut() {
    await this.clearUser();
  }

  // Open authentication page
  openAuthPage() {
    chrome.tabs.create({ url: `${API_BASE_URL}/login` });
  }
}

// Export singleton instance
const authManager = new AuthManager();
export default authManager;
