import React, { useState, useEffect } from 'react';
import { obtenerPropietariosParaSelect } from './mascotasService';
import { obtenerMascotasPorPropietario } from './mascotasService';

export default function ListadoMascotasPage({ onVerExpediente }) {
    const [propietarios, setPropietarios] = useState([]);
    const [propietarioSeleccionado, setPropietarioSeleccionado] = useState('');
    const [mascotas, setMascotas] = useState([]);
    const [cargando, setCargando] = useState(false);

    // Cargar la lista de propietarios al montar el componente
    useEffect(() => {
        obtenerPropietariosParaSelect()
            .then(data => setPropietarios(data))
            .catch(err => console.error("Error al cargar propietarios", err));
    }, []);

    // Al seleccionar un propietario, se cargan sus mascotas automáticamente
    const handleSelectPropietario = async (e) => {
        const id = e.target.value;
        setPropietarioSeleccionado(id);

        if (id) {
            setCargando(true);
            try {
                const data = await obtenerMascotasPorPropietario(id);
                setMascotas(data);
            } catch (error) {
                console.error("Error al cargar las mascotas", error);
                setMascotas([]);
            } finally {
                setCargando(false);
            }
        } else {
            setMascotas([]);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Consulta de Mascotas por Propietario</h2>

            {/* Desplegable para seleccionar Propietario */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                    Seleccione un Propietario:
                </label>
                <select 
                    value={propietarioSeleccionado} 
                    onChange={handleSelectPropietario}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">-- Elija un propietario --</option>
                    {propietarios.map(prop => (
                        <option key={prop.id} value={prop.id}>
                            {prop.nombre} {prop.apellido} ({prop.telefono || prop.documento || 'Sin doc'})
                        </option>
                    ))}
                </select>
            </div>

            {/* Listado con información básica */}
            {cargando && <p>Cargando mascotas...</p>}

            {!cargando && propietarioSeleccionado && mascotas.length === 0 && (
                <p style={{ color: '#666' }}>Este propietario no tiene mascotas registradas.</p>
            )}

            {!cargando && mascotas.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Expediente</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Nombre</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Especie</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Raza</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd' }}>Sexo</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mascotas.map(mascota => (
                            <tr key={mascota.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px', fontWeight: 'bold' }}>{mascota.codigoExpediente || `EXP-${mascota.id}`}</td>
                                <td style={{ padding: '10px' }}>{mascota.nombre}</td>
                                <td style={{ padding: '10px' }}>{mascota.especie}</td>
                                <td style={{ padding: '10px' }}>{mascota.raza || 'N/A'}</td>
                                <td style={{ padding: '10px' }}>{mascota.sexo}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    {/* Acceso directo al perfil o expediente individual */}
                                    <button 
                                        onClick={() => onVerExpediente ? onVerExpediente(mascota) : alert(`Accediendo al expediente de ${mascota.nombre}`)}
                                        style={{ 
                                            padding: '6px 12px', 
                                            backgroundColor: '#28a745', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '4px',
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Ver Expediente
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}