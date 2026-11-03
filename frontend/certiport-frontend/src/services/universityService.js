// frontend/src/services/universityService.js
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
      ...(token && { Authorization: `Bearer ${token}` })
    },
    ...options
  };

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    defaultOptions.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || 'API request failed');
  }
  
  return await response.json();
};

export const universityService = {
  // Upload template
  uploadTemplate: async (templateFile, templateName, certificateType) => {
    const formData = new FormData();
    formData.append('templateFile', templateFile);
    formData.append('templateName', templateName);
    formData.append('certificateType', certificateType);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/university/template/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Template upload failed');
    }

    return await response.json();
  },

  // Get all templates
  getTemplates: async () => {
    return await apiCall('/university/templates');
  },

  // Issue certificate
  issueCertificate: async (templateId, certificateData, studentEmail) => {
    return await apiCall('/university/certificate/issue', {
      method: 'POST',
      body: JSON.stringify({
        templateId,
        certificateData,
        studentEmail
      })
    });
  },

  // Preview certificate
  previewCertificate: async (templateId, certificateData) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/university/certificate/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        templateId,
        certificateData
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Preview failed');
    }

    return await response.text(); // Returns HTML
  },

  // Get issued certificates
  getCertificates: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return await apiCall(`/university/certificates?${queryParams}`);
  },

  // Revoke certificate
  revokeCertificate: async (certificateId) => {
    return await apiCall(`/university/certificate/${certificateId}`, {
      method: 'DELETE'
    });
  }
};