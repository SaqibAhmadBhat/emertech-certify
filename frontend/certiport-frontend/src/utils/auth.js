/**
 * Emertech Certify - Authentication Helper Utilities
 * Developer: Saqib Ahmad Bhat
 */

export const auth = {
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authChange'));
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = auth.getUser();
    return !!(token && user);
  },

  getRole: () => {
    const user = auth.getUser();
    return user ? user.role : null;
  },

  hasRole: (requiredRole) => {
    const role = auth.getRole();
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    return role === requiredRole;
  }
};

export default auth;
