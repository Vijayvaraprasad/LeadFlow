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

const normalizeStats = (data) => {
  const pipeline = {
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    won: 0,
    lost: 0
  };

  (data.byStatus || []).forEach(({ status, count }) => {
    if (Object.prototype.hasOwnProperty.call(pipeline, status)) {
      pipeline[status] = count;
    }
  });

  return {
    totalLeads: data.total || 0,
    wonDeals: data.total_value || 0,
    conversionRate: data.conversion_rate || 0,
    activePipeline: (data.total || 0) - (pipeline.won || 0) - (pipeline.lost || 0),
    pipeline,
    recentLeads: data.recent || []
  };
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
  getActivity: async (leadId) => {
    const data = await request('GET', `/leads/${leadId}/activity`);
    return Array.isArray(data) ? { activity: data } : data;
  },
  
  getUsers: async () => {
    const data = await request('GET', '/users');
    return Array.isArray(data) ? { users: data } : data;
  },
  createUser: (data) => request('POST', '/users', data),
  
  getStats: async () => normalizeStats(await request('GET', '/leads/stats'))
};
