// frontend/src/modulos/vacunas/vacunasService.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const vacunasService = {
  // 1. Obtener la cartilla de vacunación de una mascota (GCV-10 VAC-01)
  listarVacunas: async (idMascota) => {
    const res = await fetch(`${API_BASE_URL}/mascotas/${idMascota}/vacunas`);
    if (!res.ok) throw new Error('Error al consultar la cartilla de vacunación.');
    return await res.json();
  },

  // 2. Registrar una vacuna aplicada; el id de la mascota viaja en la ruta (GCV-10 VAC-01)
  registrarVacuna: async (idMascota, datosVacuna) => {
    const res = await fetch(`${API_BASE_URL}/mascotas/${idMascota}/vacunas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosVacuna)
    });

    const data = await res.json();
    if (!res.ok) {
      // Devuelve el mensaje de validación enviado por Spring Boot
      throw new Error(data.mensaje || 'No se pudo registrar la vacuna.');
    }
    return data;
  }
};
