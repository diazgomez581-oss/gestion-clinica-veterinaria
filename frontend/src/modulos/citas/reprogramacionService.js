const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '');

export async function reprogramarCita(idCita, datos) {
  const respuesta = await fetch(`${API_BASE_URL}/citas/${encodeURIComponent(idCita)}/reprogramar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fecha: datos.fecha, hora: datos.hora, idVeterinario: datos.idVeterinario })
  });
  const texto = await respuesta.text();
  let resultado;
  try { resultado = texto ? JSON.parse(texto) : null; } catch { resultado = null; }
  if (!respuesta.ok) {
    throw new Error(resultado?.mensaje || resultado?.detail || texto || 'No se pudo reprogramar la cita.');
  }
  if (!resultado?.idCita) throw new Error('El servidor no devolvió la cita guardada. Recargá la agenda antes de volver a intentar.');
  return resultado;
}
