
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const vacunasService = {
  listarVacunas: async (idMascota) => {
    const res = await fetch(`${API_BASE_URL}/mascotas/${idMascota}/vacunas`);
    if (!res.ok) throw new Error('Error al consultar la cartilla de vacunación.');
    return await res.json();
  },

  registrarVacuna: async (idMascota, datosVacuna) => {
    const res = await fetch(`${API_BASE_URL}/mascotas/${idMascota}/vacunas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosVacuna)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.mensaje || 'No se pudo registrar la vacuna.');
    }
    return data;
  }
};
