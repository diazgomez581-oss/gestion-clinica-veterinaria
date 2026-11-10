// frontend/src/modulos/citas/citasService.js
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');

export const citasService = {
  // 1. Obtener citas del día actual (Dashboard)
  getCitasHoy: async () => {
    const res = await fetch(`${API_BASE_URL}/citas/hoy/detalle`);
    if (!res.ok) throw new Error('Error al consultar las citas del día.');
    return await res.json();
  },

  // 2. Obtener todas las citas registradas (Calendario)
  getTodasLasCitas: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/citas`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Endpoint general de citas no disponible.', e);
    }
    return [];
  },

  // 3. Obtener veterinarios
  getVeterinarios: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/citas/veterinarios`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Endpoint de veterinarios no disponible, usando respaldo.', e);
    }
    return null;
  },

  // 4. Obtener propietarios
  getPropietarios: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/propietarios`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /propietarios no disponible.', e);
    }
    return null;
  },

  // 5. Obtener mascotas
  getMascotas: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mascotas`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API /mascotas no disponible.', e);
    }
    return null;
  },

  // 6. Consultar horarios ocupados del veterinario y de la mascota.
  // Requiere GET /api/citas/disponibilidad en Spring Boot.
  getDisponibilidad: async (fecha, idVeterinario, idMascota, signal) => {
    const params = new URLSearchParams({
      fecha: String(fecha),
      idVeterinario: String(idVeterinario)
    });
    if (idMascota != null && idMascota !== '') {
      params.set('idMascota', String(idMascota));
    }

    const res = await fetch(
      `${API_BASE_URL}/citas/disponibilidad?${params.toString()}`,
      { signal }
    );

    if (!res.ok) {
      throw new Error('No se pudo consultar la disponibilidad de horarios.');
    }
    const datos = await res.json();
    if (!Array.isArray(datos?.horariosVeterinario) || !Array.isArray(datos?.horariosMascota)) {
      throw new Error('La respuesta de disponibilidad no tiene el formato esperado.');
    }
    return datos;
  },

  // 7. Guardar nueva cita
  guardarCita: async (datosCita) => {
    const res = await fetch(`${API_BASE_URL}/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosCita)
    });

    if (!res.ok) {
      const errorMsg = await res.text();
      throw new Error(errorMsg || 'No se pudo guardar la cita.');
    }
    return await res.json();
  },

  // 8. Check-in
  registrarCheckIn: async (idCita) => {
    const res = await fetch(`${API_BASE_URL}/citas/${idCita}/check-in`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Error al registrar el check-in.');
    return await res.json();
  },

  // 9. Actualizar estado
  actualizarEstado: async (idCita, nuevoEstado) => {
    const res = await fetch(`${API_BASE_URL}/citas/${idCita}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) {
      const mensaje = await res.text();
      throw new Error(mensaje || 'No se pudo actualizar el estado de la cita.');
    }
    return await res.json();
  }
};
