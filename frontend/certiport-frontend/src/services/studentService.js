// frontend/src/services/studentService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function for API calls with authentication
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...options
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'API request failed');
  }
  
  return await response.json();
};

export const studentService = {
  // Get student profile
  getProfile: async () => {
    return await apiCall('/student/profile');
  },

  // Update student profile
  updateProfile: async (profileData) => {
    return await apiCall('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  // Get all student certificates
  getCertificates: async () => {
    return await apiCall('/student/certificates');
  },

  // Get specific certificate details
  getCertificateDetails: async (certificateId) => {
    return await apiCall(`/student/certificates/${certificateId}`);
  },

  // Download certificate
  downloadCertificate: async (certificateId) => {
    return await apiCall(`/student/certificates/${certificateId}/download`);
  },

  // Verify certificate by blockchain ID (public endpoint)
  verifyCertificate: async (blockchainId) => {
    return await apiCall(`/public/verify/${blockchainId}`);
  }
};