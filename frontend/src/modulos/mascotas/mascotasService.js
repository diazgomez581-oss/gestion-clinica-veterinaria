import axios from 'axios';

const API_URL = 'http://localhost:8080/api/mascotas';
const API_PROPIETARIOS_URL = 'http://localhost:8080/api/propietarios';

export const obtenerMascotas = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error('Error al obtener las mascotas:', error);
        throw error;
    }
};

export const registrarMascota = async (mascotaData) => {
    try {
        const response = await axios.post(API_URL, mascotaData);
        return response.data;
    } catch (error) {
        console.error('Error al registrar la mascota:', error);
        throw error;
    }
};

export const obtenerPropietariosParaSelect = async () => {
    try {
        const response = await axios.get(API_PROPIETARIOS_URL);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los propietarios:', error);
        throw error;
    }
};

export const obtenerMascotasPorPropietario = async (propietarioId) => {
    try {
        const response = await axios.get(`${API_URL}/propietario/${propietarioId}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener mascotas del propietario:', error);
        throw error;
    }
};
