const API_URL = 'http://localhost:8080/api/propietarios';

export const propietariosService = {
  async listarTodos() {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Error al cargar la lista de propietarios.');
    }
    return await response.json();
  },

  async obtenerPorId(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
      throw new Error('No se encontró el propietario solicitado.');
    }
    return await response.json();
  },

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
