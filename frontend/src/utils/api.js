const BASE_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  const userId = localStorage.getItem("vsph_user_id");
  if (userId) {
    headers["x-user-id"] = userId;
  }
  return headers;
};

export const api = {
  post: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  get: async (endpoint) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  put: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (endpoint, data) => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return response.json();
  },
};
