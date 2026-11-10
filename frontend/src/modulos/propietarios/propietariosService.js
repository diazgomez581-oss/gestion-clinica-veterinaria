
const API_URL = 'http://localhost:8080/api/propietarios';

// Leer respuestas del servidor de forma segura.
// Algunas operaciones, como DELETE, pueden devolver una respuesta vacía.
const leerRespuesta = async (response) => {
  const texto = await response.text();

  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
};

// Obtener el mensaje de error enviado por Spring Boot.
const obtenerMensajeError = (data, mensajePredeterminado) => {
  if (data && typeof data === 'object') {
    return (
      data.mensaje ||
      data.message ||
      data.error ||
      mensajePredeterminado
    );
  }

  return mensajePredeterminado;
};

export const propietariosService = {

  // ========================================
  // 1. LISTAR TODOS LOS PROPIETARIOS
  // ========================================
  async listarTodos() {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await leerRespuesta(response);

      throw new Error(
        obtenerMensajeError(
          data,
          'Error al cargar la lista de propietarios.'
        )
      );
    }

    const data = await leerRespuesta(response);
    return data ?? [];
  },

  // ========================================
  // 2. OBTENER PROPIETARIO POR ID
  // ========================================
  async obtenerPorId(id) {
    if (id === undefined || id === null || id === '') {
      throw new Error('Debes indicar el ID del propietario.');
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await leerRespuesta(response);

    if (!response.ok) {
      throw new Error(
        obtenerMensajeError(
          data,
          'No se encontró el propietario solicitado.'
        )
      );
    }

    return data;
  },

  // ========================================
  // 3. REGISTRAR NUEVO PROPIETARIO
  // ========================================
  async registrar(propietario) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(propietario),
    });

    const data = await leerRespuesta(response);

    if (!response.ok) {
      throw new Error(
        obtenerMensajeError(
          data,
          'Error al registrar el propietario.'
        )
      );
    }

    return data;
  },

  // ========================================
  // 4. ACTUALIZAR DATOS DEL PROPIETARIO
  // ========================================
  async actualizar(id, propietario) {
    if (id === undefined || id === null || id === '') {
      throw new Error('Debes indicar el ID del propietario.');
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(propietario),
    });

    const data = await leerRespuesta(response);

    if (!response.ok) {
      throw new Error(
        obtenerMensajeError(
          data,
          'Error al actualizar los datos del propietario.'
        )
      );
    }

    return data;
  },

  // ========================================
  // 5. ELIMINAR PROPIETARIO
  // ========================================
  async eliminar(id) {
    if (id === undefined || id === null || id === '') {
      throw new Error('Debes indicar el ID del propietario.');
    }

    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await leerRespuesta(response);

    if (!response.ok) {
      throw new Error(
        obtenerMensajeError(
          data,
          'No se pudo eliminar el propietario. Verifica si tiene mascotas asociadas.'
        )
      );
    }

    return data;
  },

};
