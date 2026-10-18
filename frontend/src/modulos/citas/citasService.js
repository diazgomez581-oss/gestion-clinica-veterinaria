// frontend/src/modulos/citas/citasService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const citasService = {
  // 1. Obtener citas del día actual (para el Dashboard)
  getCitasHoy: async () => {
    const res = await fetch(`${API_BASE_URL}/citas/hoy`);
    if (!res.ok) throw new Error('Error al consultar las citas del día.');
    return await res.json();
  },

  // 2. Obtener TODAS las citas registradas en la base de datos (para el Calendario)
  getTodasLasCitas: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/citas`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Endpoint general de citas no disponible.');
    }
    return [];
  },

  // 3. Obtener veterinarios registrados en PostgreSQL
  getVeterinarios: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/citas/veterinarios`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Endpoint de veterinarios no disponible, usando respaldo.');
    }
    return null;
  },

  // 4. Obtener propietarios reales desde la base de datos
  getPropietarios: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/propietarios`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /propietarios no disponible.');
    }
    return null;
  },

  // 5. Obtener mascotas reales desde la base de datos
  getMascotas: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mascotas`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /mascotas no disponible.');
    }
    return null;
  },

  // 6. Guardar nueva cita médica en PostgreSQL con validación RN-02 (CIT-01)
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

  // 7. Check-in de llegada física a sala de espera (CIT-02)
  registrarCheckIn: async (idCita) => {
    const res = await fetch(`${API_BASE_URL}/citas/${idCita}/check-in`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Error al registrar el check-in.');
    return await res.json();
  }
};