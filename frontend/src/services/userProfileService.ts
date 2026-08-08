const API_URL = 'http://localhost:8000/api/v1/user-profile';

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const userProfileService = {
  async getProfile() {
    const res = await fetch(`${API_URL}/me`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch profile: ${res.statusText}`);
    }
    return await res.json();
  },

  async createProfile(data: any) {
    const res = await fetch(`${API_URL}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(`Failed to create profile: ${res.statusText}`);
    }
    return await res.json();
  },

  async updateProfile(data: any) {
    const res = await fetch(`${API_URL}/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      throw new Error(`Failed to update profile: ${res.statusText}`);
    }
    return await res.json();
  }
};
