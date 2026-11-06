const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const leerError = async (response, fallback) => {
  try {
    const raw = await response.text();
    if (!raw) return fallback;
    try {
      const data = JSON.parse(raw);
      return data?.mensaje || raw;
    } catch {
      return raw;
    }
  } catch {
    return fallback;
  }
};

export const tratamientosService = {
  listarPorConsulta: async (idConsulta) => {
    const response = await fetch(`${API_BASE_URL}/tratamientos/consulta/${idConsulta}`);
    if (!response.ok) {
      throw new Error(await leerError(response, 'No se pudieron cargar los tratamientos.'));
    }
    return await response.json();
  },

  registrar: async (tratamiento) => {
    const response = await fetch(`${API_BASE_URL}/tratamientos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tratamiento)
    });

    if (!response.ok) {
      throw new Error(await leerError(response, 'No se pudo registrar el tratamiento.'));
    }
    return await response.json();
  },

  actualizar: async (idTratamiento, tratamiento) => {
    const response = await fetch(`${API_BASE_URL}/tratamientos/${idTratamiento}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tratamiento)
    });

    if (!response.ok) {
      throw new Error(await leerError(response, 'No se pudo actualizar el tratamiento.'));
    }
    return await response.json();
  },

  eliminar: async (idTratamiento) => {
    const response = await fetch(`${API_BASE_URL}/tratamientos/${idTratamiento}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(await leerError(response, 'No se pudo eliminar el tratamiento.'));
    }
  }
};
