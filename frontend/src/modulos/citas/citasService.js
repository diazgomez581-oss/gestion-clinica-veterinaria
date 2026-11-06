
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const citasService = {

  getCitasHoy: async () => {
  const res = await fetch(`${API_BASE_URL}/citas/hoy/detalle`);
  if (!res.ok) throw new Error('Error al consultar las citas del día.');
  return await res.json();
  },

  getTodasLasCitas: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/citas`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Endpoint general de citas no disponible.');
    }
    return [];
  },

  getVeterinarios: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/citas/veterinarios`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Endpoint de veterinarios no disponible, usando respaldo.');
    }
    return null;
  },

  getPropietarios: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/propietarios`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /propietarios no disponible.');
    }
    return null;
  },

  getMascotas: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mascotas`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /mascotas no disponible.');
    }
    return null;
  },

  guardarCita: async (datosCita) => {
    const res = await fetch(`${API_BASE_URL}/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosCita)
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(errorMsg || 'No se pudo guardar la cita en la base de datos.');
    }
    return await res.json();
  },

  registrarCheckIn: async (idCita) => {
    const res = await fetch(`${API_BASE_URL}/citas/${idCita}/check-in`, {
      method: 'PATCH'
    });

    if (!res.ok) throw new Error('Error al registrar el check-in.');
    return await res.json();
  },

  actualizarEstado: async (idCita, nuevoEstado) => {
    const res = await fetch(`${API_BASE_URL}/citas/${idCita}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) {
      const mensaje = await res.text();
      throw new Error(mensaje || 'No se pudo actualizar el estado de la cita.');
    }

    return await res.json();
  }
};
