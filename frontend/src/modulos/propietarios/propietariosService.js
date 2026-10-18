const API_URL = 'http://localhost:8080/api/propietarios';

export const propietariosService = {
  // Obtener todos los propietarios registrados
  async listarTodos() {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Error al cargar la lista de propietarios.');
    }
    return await response.json();
  },

  // Registrar un nuevo propietario (Historia PRO-01 / GCV-1)
  async registrar(propietario) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propietario),
    });

    const data = await response.json();

    if (!response.ok) {
      // Devuelve el mensaje de error o validación enviado por Spring Boot
      throw new Error(data.mensaje || 'Error al registrar el propietario.');
    }

    return data;
  },
};