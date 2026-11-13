const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/+$/, '');

const API_BASE_URL = `${API_BASE}/api`;

const leerError = async (response, fallback) => {
  try {
    const data = await response.json();
    return data?.mensaje || fallback;
  } catch {
    return fallback;
  }
};

export const historialClinicoService = {
  listarMascotas: async () => {
    const response = await fetch(`${API_BASE_URL}/mascotas`);
    if (!response.ok) {
      throw new Error('No se pudieron cargar las mascotas.');
    }
    return await response.json();
  },

  obtenerHistorial: async (idMascota) => {
    const response = await fetch(`${API_BASE_URL}/historial/mascota/${idMascota}`);
    if (!response.ok) {
      const mensaje = await leerError(response, 'No se pudo cargar el historial clínico.');
      throw new Error(mensaje);
    }
    return await response.json();
  }
};
