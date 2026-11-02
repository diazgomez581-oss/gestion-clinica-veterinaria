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

  // Obtener un propietario por su ID
  async obtenerPorId(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      throw new Error('No se encontró el propietario solicitado.');
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
      throw new Error(data.mensaje || 'Error al registrar el propietario.');
    }

    return data;
  },

  // Actualizar datos de contacto de un propietario (Historia PRO-02 / GCV-2)
  async actualizar(id, propietario) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propietario),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al actualizar los datos del propietario.');
    }

    return data;
  },

  // Eliminar un propietario por su ID
  async eliminar(id) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al eliminar el propietario.');
    }

    return data;
  },
};