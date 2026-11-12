import React, { useEffect, useState } from 'react';
import { ArrowLeft, Phone, TriangleAlert } from 'lucide-react';
import { formatearFecha, vacunasService } from './vacunasService';

const textoDias = (dias) => {
  if (dias < 0) return `Vencida hace ${-dias} ${dias === -1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return `En ${dias} días`;
};

const claseDias = (dias) => {
  if (dias < 0) return '';
  return dias <= 7 ? 'yellow' : 'gray';
};

const normalizarNombre = (texto = '') =>
  (texto ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es')
    .trim();

export default function ProximasVacunasPage({ onVolver, onAgendarCita }) {
  const [busqueda, setBusqueda] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [resultado, setResultado] = useState(null);

  const rangoInvertido = Boolean(desde && hasta && desde > hasta);
  const consultaActual = resultado?.hasta === hasta ? resultado : null;
  const cargando = !rangoInvertido && !consultaActual;
  const error = rangoInvertido
    ? 'La fecha Hasta debe ser igual o posterior a Desde.'
    : consultaActual?.error;

  useEffect(() => {
    let vigente = true;

    // Con Hasta vacío se conserva el listado inicial de 30 días.
    const consulta = hasta
      ? vacunasService.listarProximasHasta(hasta)
      : vacunasService.listarProximas(30);

    consulta
      .then((datos) => {
        if (vigente) setResultado({ hasta, datos: datos ?? [], error: '' });
      })
      .catch((err) => {
        if (vigente) setResultado({ hasta, datos: [], error: err.message });
      });

    return () => {
      vigente = false;
    };
  }, [hasta]);

  const termino = normalizarNombre(busqueda);
  const proximasFiltradas = (consultaActual?.datos ?? []).filter((vacuna) => {
  const fecha = vacuna.proximaDosis;

  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;

  return (
    normalizarNombre(vacuna.nombreMascota).includes(termino) ||
    normalizarNombre(vacuna.nombrePropietario).includes(termino)
  );
  });

  const mostrarAccion = typeof onAgendarCita === 'function';
  const columnas = mostrarAccion ? 7 : 6;

  return (
    <div className="cita-page-container">
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span
              onClick={onVolver}
              className="breadcrumb-link"
              style={{ cursor: 'pointer' }}
            >
              Dashboard
            </span>
            {' > '}
            <span>Próximas vacunas</span>
          </div>

          <h1 className="cita-page-title">Próximas Vacunas</h1>
          <p className="cita-page-sub">
            Refuerzos por aplicar y datos de contacto del propietario
          </p>
        </div>

        <button type="button" onClick={onVolver} className="btn-volver-dash">
          <ArrowLeft size="1em" className="icono-texto" />
          Volver al Dashboard
        </button>
      </div>

      <div className="cita-card-section">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div className="input-group-vet" style={{ flex: '1 1 280px' }}>
            <label htmlFor="buscar-refuerzo">Buscar mascota o propietario</label>
            <input
              id="buscar-refuerzo"
              type="search"
              placeholder="Ej. Luna o Lucía"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          <div className="input-group-vet" style={{ flex: '1 1 160px' }}>
            <label htmlFor="refuerzos-desde">Desde</label>
            <input
              id="refuerzos-desde"
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(event) => setDesde(event.target.value)}
            />
          </div>

          <div className="input-group-vet" style={{ flex: '1 1 160px' }}>
            <label htmlFor="refuerzos-hasta">Hasta</label>
            <input
              id="refuerzos-hasta"
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(event) => setHasta(event.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="alert-banner-danger" role="alert">
            <TriangleAlert size="1em" className="icono-texto" /> {error}
          </div>
        ) : (
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
                  {mostrarAccion && <th>Acción</th>}
                </tr>
              </thead>

              <tbody>
                {cargando || proximasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={columnas} style={{ textAlign: 'center', color: '#64748b' }}>
                      {cargando
                        ? 'Cargando vacunas...'
                        : 'No hay refuerzos que coincidan con los filtros.'}
                    </td>
                  </tr>
                ) : (
                  proximasFiltradas.map((vacuna) => (
                    <tr
                      key={vacuna.idAplicacionVacuna}
                      className={vacuna.diasRestantes < 0 ? 'alert-banner-danger' : undefined}
                    >
                      <td>
                        <span className="pill-hour-aqua">
                          {formatearFecha(vacuna.proximaDosis)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${claseDias(vacuna.diasRestantes)}`}>
                          {textoDias(vacuna.diasRestantes)}
                        </span>
                      </td>
                      <td className="motive-cell-text">{vacuna.nombreTipoVacuna}</td>
                      <td>
                        <strong className="pet-name-title">{vacuna.nombreMascota}</strong>
                      </td>
                      <td>{vacuna.nombrePropietario}</td>
                      <td>
                        <Phone size="1em" className="icono-texto" /> {vacuna.telefonoPropietario}
                      </td>
                      {mostrarAccion && (
                      <td>
                        {vacuna.idCitaAgendada != null ? (
                          <span
                            className="status-badge"
                            style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                          >
                            Cita agendada
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-outline-action"
                            onClick={() => onAgendarCita(vacuna)}
                          >
                            Agendar cita
                          </button>
                        )}
                      </td>
                    )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}