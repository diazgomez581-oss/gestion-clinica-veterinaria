import axios from 'axios';

// URL base de tu API de backend (ajústala si tu puerto o ruta es diferente)
const API_URL = 'http://localhost:8080/api/mascotas';
const API_PROPIETARIOS_URL = 'http://localhost:8080/api/propietarios';

// Obtener la lista de todas las mascotas
export const obtenerMascotas = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error al obtener las mascotas:', error);
        throw error;
    }
};

// Registrar una nueva mascota vinculada a un propietario
export const registrarMascota = async (mascotaData) => {
    try {
        const response = await axios.post(API_URL, mascotaData);
        return response.data;
    } catch (error) {
        console.error('Error al registrar la mascota:', error);
        throw error;
    }
};

// Obtener la lista de propietarios (necesario para el desplegable del formulario)
export const obtenerPropietariosParaSelect = async () => {
    try {
        const response = await axios.get(API_PROPIETARIOS_URL);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los propietarios:', error);
        throw error;
    }
};