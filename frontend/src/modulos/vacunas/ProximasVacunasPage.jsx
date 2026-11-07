import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, TriangleAlert } from 'lucide-react';
import { formatearFecha, vacunasService } from './vacunasService';

const OPCIONES_DIAS = [7, 15, 30];

const textoDias = (dias) => {
  if (dias < 0) return `Vencida hace ${-dias} ${dias === -1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
};

// Las vencidas heredan el color de la fila resaltada
const claseDias = (dias) => {
  if (dias < 0) return '';
  return dias <= 7 ? 'yellow' : 'gray';
};

export default function ProximasVacunasPage({ onVolver }) {
  const [dias, setDias] = useState(30);
  const [proximas, setProximas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Evita que una respuesta tardía reemplace la del filtro seleccionado después
    let vigente = true;

    vacunasService.listarProximas(dias)
      .then(data => {
        if (!vigente) return;
        setProximas(data);
        setError('');
      })
      .catch(err => {
        if (!vigente) return;
        setProximas([]);
        setError(err.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [dias]);

  const cambiarDias = (valor) => {
    if (valor === dias) return;
    setCargando(true);
    setDias(valor);
  };

  return (
    <div className="cita-page-container">
      {/* Header */}
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link" style={{ cursor: 'pointer' }}>Dashboard</span> &gt; <span>Próximas vacunas</span>
          </div>
          <h1 className="cita-page-title">Próximas Vacunas</h1>
          <p className="cita-page-sub">Refuerzos por aplicar y datos de contacto del propietario</p>
        </div>

        <button type="button" onClick={onVolver} className="btn-volver-dash">
          <ArrowLeft size="1em" className="icono-texto" /> Volver al Dashboard
        </button>
      </div>

      {error && (
        <div className="alert-banner-danger">
          <TriangleAlert size="1em" className="icono-texto" /> {error}
        </div>
      )}

      <div className="cita-card-section">
        {/* Filtro por días */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {OPCIONES_DIAS.map(opcion => (
            <button
              key={opcion}
              type="button"
              className={opcion === dias ? 'btn-new-appointment' : 'btn-outline-action'}
              aria-pressed={opcion === dias}
              onClick={() => cambiarDias(opcion)}
            >
              {opcion} días
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="clean-table">
            <thead>
              <tr>
                <th>Próxima dosis</th>
                <th>Faltan</th>
                <th>Vacuna</th>
                <th>Mascota</th>
                <th>Propietario</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>
                    Cargando vacunas...
                  </td>
                </tr>
              ) : proximas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>
                    No hay refuerzos programados en los próximos {dias} días.
                  </td>
                </tr>
              ) : (
                proximas.map(vacuna => (
                  <tr key={vacuna.idAplicacionVacuna} className={vacuna.diasRestantes < 0 ? 'alert-banner-danger' : undefined}>
                    <td><span className="pill-hour-aqua">{formatearFecha(vacuna.proximaDosis)}</span></td>
                    <td>
                      <span className={`status-badge ${claseDias(vacuna.diasRestantes)}`}>
                        {textoDias(vacuna.diasRestantes)}
                      </span>
                    </td>
                    <td className="motive-cell-text">{vacuna.nombreTipoVacuna}</td>
                    <td><strong className="pet-name-title">{vacuna.nombreMascota}</strong></td>
                    <td>{vacuna.nombrePropietario}</td>
                    <td><Phone size="1em" className="icono-texto" /> {vacuna.telefonoPropietario}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
