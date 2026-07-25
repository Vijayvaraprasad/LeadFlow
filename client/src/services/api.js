const BASE_URL = '/api';

const getToken = () => localStorage.getItem('token');

const request = async (method, path, body = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data;
};

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  
  getLeads: (params) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });
    }
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request('GET', `/leads${queryString}`);
  },
  
  getLead: (id) => request('GET', `/leads/${id}`),
  captureLead: (data) => request('POST', '/leads/capture', data),
  updateLead: (id, data) => request('PUT', `/leads/${id}`, data),
  deleteLead: (id) => request('DELETE', `/leads/${id}`),
  
  addNote: (leadId, content) => request('POST', `/leads/${leadId}/notes`, { content }),
  getActivity: (leadId) => request('GET', `/leads/${leadId}/activity`),
  
  getUsers: () => request('GET', '/users'),
  createUser: (data) => request('POST', '/users', data),
  
  getStats: () => request('GET', '/leads/stats')
};
