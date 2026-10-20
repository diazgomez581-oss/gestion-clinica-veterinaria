import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function RegistrarMascotaPage() {
    const [propietarios, setPropietarios] = useState([]);
    const [formData, setFormData] = useState({
        nombre: '',
        especie: '',
        raza: '',
        sexo: 'Macho',
        fechaNacimiento: '',
        color: '',
        propietario: { id: '' }
    });
    const [mensaje, setMensaje] = useState('');

    // Cargar la lista de propietarios existentes al iniciar (Criterio 1)
    useEffect(() => {
        axios.get('http://localhost:8080/api/propietarios') // Ajusta tu ruta de API si es necesario
            .then(response => setPropietarios(response.data))
            .catch(error => console.error("Error al cargar propietarios", error));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'propietarioId') {
            setFormData({ ...formData, propietario: { id: value } });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/api/mascotas', formData);
            setMensaje(`¡Mascota registrada con éxito! Expediente asignado: ${response.data.codigoExpediente}`);
            setFormData({
                nombre: '',
                especie: '',
                raza: '',
                sexo: 'Macho',
                fechaNacimiento: '',
                color: '',
                propietario: { id: '' }
            });
        } catch (error) {
            setMensaje('Error al registrar la mascota. Asegúrate de seleccionar un propietario.');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2>Registro de Mascota y Apertura de Expediente</h2>
            {mensaje && <p style={{ backgroundColor: '#e2f0d9', padding: '10px' }}>{mensaje}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                {/* Criterio 1: Selección de propietario existente */}
                <div>
                    <label>Propietario Asignado: *</label>
                    <select name="propietarioId" value={formData.propietario.id} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
                        <option value="">-- Seleccione un propietario --</option>
                        {propietarios.map(prop => (
                            <option key={prop.id} value={prop.id}>
                                {prop.nombre} {prop.apellido} (CI/Tel: {prop.telefono || prop.documento})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Criterio 2: Captura de datos de la mascota */}
                <div>
                    <label>Nombre de la Mascota: *</label>
                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                </div>

                <div>
                    <label>Especie (Ej. Canino, Felino): *</label>
                    <input type="text" name="especie" value={formData.especie} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                </div>

                <div>
                    <label>Raza:</label>
                    <input type="text" name="raza" value={formData.raza} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>

                <div>
                    <label>Sexo:</label>
                    <select name="sexo" value={formData.sexo} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                        <option value="Macho">Macho</option>
                        <option value="Hembra">Hembra</option>
                    </select>
                </div>

                <div>
                    <label>Fecha de Nacimiento (o aproximada):</label>
                    <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>

                <div>
                    <label>Color:</label>
                    <input type="text" name="color" value={formData.color} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>

                <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Registrar Mascota y Generar Expediente
                </button>
            </form>
        </div>
    );
}