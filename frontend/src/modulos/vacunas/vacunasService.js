const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
).replace(/\/+$/, '');

// YYYY-MM-DD → DD/MM/YYYY sin convertir la fecha a otra zona horaria.
export const formatearFecha = (fecha) =>
  fecha ? fecha.split('-').reverse().join('/') : '—';

async function procesarRespuesta(res, mensajePredeterminado) {
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.mensaje || error?.detail || mensajePredeterminado);
  }

  const texto = await res.text();
  return texto.trim() ? JSON.parse(texto) : null;
}

export const vacunasService = {
  async listarVacunas(idMascota) {
    const res = await fetch(`${API_BASE_URL}/mascotas/${idMascota}/vacunas`);
    return procesarRespuesta(res, 'Error al consultar la cartilla de vacunación.');
  },

  async registrarVacuna(idMascota, datosVacuna) {
    const res = await fetch(`${API_BASE_URL}/mascotas/${idMascota}/vacunas`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosVacuna),
    });

    return procesarRespuesta(res, 'No se pudo registrar la vacuna.');
  },

  async listarProximas(dias) {
    const res = await fetch(
      `${API_BASE_URL}/vacunas/proximas?dias=${encodeURIComponent(dias)}`
    );

    return procesarRespuesta(res, 'Error al consultar las próximas vacunas.');
  },

  async listarProximasHasta(hasta) {
    const res = await fetch(
      `${API_BASE_URL}/vacunas/proximas?hasta=${encodeURIComponent(hasta)}`
    );

    return procesarRespuesta(res, 'Error al consultar las próximas vacunas.');
  },
};