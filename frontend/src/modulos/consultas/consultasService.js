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

export const consultasService = {
  getCitasHoy: async () => {
    const res = await fetch(`${API_BASE_URL}/citas/hoy`);
    if (!res.ok) throw new Error('No se pudieron consultar las citas del día.');
    return await res.json();
  },

  getMascotas: async () => {
    const res = await fetch(`${API_BASE_URL}/mascotas`);
    if (!res.ok) throw new Error('No se pudieron consultar las mascotas.');
    return await res.json();
  },

  getVeterinarios: async () => {
    const res = await fetch(`${API_BASE_URL}/citas/veterinarios`);
    if (!res.ok) throw new Error('No se pudieron consultar los veterinarios.');
    return await res.json();
  },

  getHistorialMascota: async (idMascota) => {
    const res = await fetch(`${API_BASE_URL}/consultas/mascota/${idMascota}`);
    if (!res.ok) {
      const mensaje = await leerError(res, 'No se pudo cargar el historial clínico.');
      throw new Error(mensaje);
    }
    return await res.json();
  },

  registrarConsulta: async (datosConsulta) => {
    const res = await fetch(`${API_BASE_URL}/consultas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosConsulta)
    });

    if (!res.ok) {
      const mensaje = await leerError(res, 'No se pudo registrar la consulta médica.');
      throw new Error(mensaje);
    }

    return await res.json();
  }
};
