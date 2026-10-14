const API_BASE_URL = 'http://localhost:8080/api';

export const apiClient = {
  // Peticiones GET (Listar / Consultar)
  get: async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || `Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw error;
    }
  },

  // Peticiones POST (Crear / Registrar)
  post: async (endpoint, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || `Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      throw error;
    }
  },

  // Peticiones PUT (Actualizar)
  put: async (endpoint, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || `Error HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error en PUT ${endpoint}:`, error);
      throw error;
    }
  }
};