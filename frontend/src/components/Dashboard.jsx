import React, { useState, useEffect } from 'react';
import { citasService } from '../modulos/citas/citasService';

export default function Dashboard({ onIrAProgramar }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  
  // Selector dinámico de fecha para visualizar diferentes días
  const obtenerFechaLocalStr = (fechaObj = new Date()) => {
    const anio = fechaObj.getFullYear();
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaObj.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };
  const [fechaFiltro, setFechaFiltro] = useState(obtenerFechaLocalStr());

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // 1. Cargar citas desde PostgreSQL (todas las citas y luego filtramos por fechaFiltro)
  const cargarCitasDeBD = async () => {
    try {
      setCargando(true);
      setErrorCarga('');
      
      // Obtenemos el catálogo general completo
      const dataBD = await citasService.getTodasLasCitas();

      // Filtramos en frontend por la fecha seleccionada en el selector (fechaFiltro)
      const citasFiltradasFecha = (dataBD || []).filter(c => c.fecha === fechaFiltro);

      // Mapeo defensivo de los datos devueltos por Spring Boot
      const citasFormateadas = citasFiltradasFecha.map((c) => {
        const horaCorta = c.hora ? String(c.hora).substring(0, 5) : '00:00';
        return {
          idCita: c.idCita,
          id: c.idCita,
          hora: horaCorta,
          horaProgramada: horaCorta,
          fecha: c.fecha,
          mascota: c.mascota || (c.idMascota === 1 ? 'Max' : c.idMascota === 2 ? 'Rocky' : c.idMascota === 3 ? 'Luna' : `Mascota #${c.idMascota}`),
          icono: c.idMascota === 3 ? '🐱' : '🐶',
          dueno: c.dueno || c.propietario || (c.idMascota === 1 || c.idMascota === 2 ? 'Carlos Alberto Pérez Ramos' : 'Propietario'),
          veterinario: c.veterinario || (c.idVeterinario === 1 ? 'Dr. Daniel Solano' : c.idVeterinario === 2 ? 'Dr. Carlos Rodríguez' : 'Dra. María Santos'),
          motivo: c.motivo || 'Consulta médica',
          estado: c.estado || 'Programada',
          horaLlegada: c.horaLlegada ? String(c.horaLlegada).substring(0, 5) : null
        };
      });

      // Ordenar por hora de menor a mayor
      citasFormateadas.sort((a, b) => a.hora.localeCompare(b.hora));
      setCitas(citasFormateadas);

    } catch (err) {
      setErrorCarga('No se pudo conectar con el servidor backend (puerto 8080).');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCitasDeBD();
  }, [fechaFiltro]); // Se recarga automáticamente si el usuario cambia el día

  // 2. Marcar llegada en PostgreSQL y refrescar el estado
  const handleCheckIn = async (idCita) => {
    try {
      await citasService.registrarCheckIn(idCita);
      await cargarCitasDeBD();
    } catch (err) {
      alert(`Error al registrar check-in: ${err.message}`);
    }
  };

  // 3. Métricas calculadas en tiempo real para el día seleccionado
  const totalCitasHoy = citas.length;
  const enEspera = citas.filter((c) => c.estado === 'En Sala de Espera' || c.estado === 'En espera');
  const programadas = citas.filter((c) => c.estado === 'Programada').length;
  const atendidas = citas.filter((c) => c.estado === 'Atendida').length;

  // 4. Filtrado interactivo en tabla
  const citasFiltradas = citas.filter((c) => {
    const coincideEstado =
      filtroEstado === 'TODOS' ||
      c.estado === filtroEstado ||
      (filtroEstado === 'En espera' && c.estado === 'En Sala de Espera');

    const term = busqueda.toLowerCase();
    const coincideBusqueda =
      (c.mascota || '').toLowerCase().includes(term) ||
      (c.dueno || '').toLowerCase().includes(term) ||
      (c.motivo || '').toLowerCase().includes(term) ||
      (c.veterinario || '').toLowerCase().includes(term);

    return coincideEstado && coincideBusqueda;
  });

  return (
    <div className="dash-white-layout">
      {/* 1. Header con Buscador de Fecha Integrado */}
      <div className="dash-header-clean">
        <div>
          <h1 className="dash-title-clean">Dashboard General</h1>
          <p className="dash-date-clean">
            Mostrando agenda operativa para la fecha seleccionada.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '6px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Día de consulta:</span>
            <input 
              type="date" 
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', fontWeight: 700, color: '#0369a1', cursor: 'pointer' }}
            />
          </div>

          <button type="button" onClick={cargarCitasDeBD} className="btn-outline-action" title="Recargar base de datos">
            🔄 Refrescar
          </button>
          
          <button type="button" className="btn-new-appointment" onClick={onIrAProgramar}>
            <span>+</span> Nueva Cita
          </button>
        </div>
      </div>

      {errorCarga && (
        <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          ⚠️ {errorCarga}
        </div>
      )}

      {/* 2. KPIs Dinámicos */}
      <section className="dash-kpi-container">
        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">Citas para el día</span>
            <div className="kpi-number-text">{cargando ? '...' : totalCitasHoy}</div>
            <span className="kpi-sub-text">{programadas} programadas · {enEspera.length} en espera</span>
          </div>
          <div className="kpi-avatar-circle circle-aqua">🗓️</div>
        </div>

        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">En sala de espera</span>
            <div className="kpi-number-text text-aqua">{cargando ? '...' : enEspera.length}</div>
            <span className="kpi-sub-text">Esperando ser llamados</span>
          </div>
          <div className="kpi-avatar-circle circle-amber">⏳</div>
        </div>

        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">Atendidas</span>
            <div className="kpi-number-text">{cargando ? '...' : atendidas}</div>
            <span className="kpi-sub-text">Consultas cerradas</span>
          </div>
          <div className="kpi-avatar-circle circle-blue">🩺</div>
        </div>

        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">Veterinarios activos</span>
            <div className="kpi-number-text text-pink">3</div>
            <span className="kpi-sub-text">Personal médico de turno</span>
          </div>
          <div className="kpi-avatar-circle circle-pink">👨‍⚕️</div>
        </div>
      </section>

      {/* 3. Panel de Dos Columnas */}
      <div className="dash-grid-two">
        {/* Tabla de Citas del Día */}
        <section className="clean-panel-box">
          <div className="clean-panel-header">
            <div className="panel-title-flex">
              <span>🗓️</span>
              <h2 className="panel-heading">Citas del Día</h2>
            </div>
            <button type="button" className="btn-outline-action" onClick={onIrAProgramar}>
              + Agendar
            </button>
          </div>

          <div className="panel-search-padding">
            <input
              type="text"
              placeholder="Buscar por mascota, propietario, veterinario o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="table-search-input"
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Mascota / Propietario</th>
                  <th>Veterinario</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      Cargando datos de la agenda...
                    </td>
                  </tr>
                ) : citasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      No hay citas registradas para la fecha seleccionada.
                    </td>
                  </tr>
                ) : (
                  citasFiltradas.map((c) => (
                    <tr key={c.idCita}>
                      <td>
                        <span className="pill-hour-aqua">{c.hora}</span>
                      </td>
                      <td>
                        <div className="pet-cell-flex">
                          <span className="pet-icon-bubble">{c.icono}</span>
                          <div>
                            <strong className="pet-name-title">{c.mascota}</strong>
                            <div className="owner-subtitle">{c.dueno}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="vet-cell-pill">{c.veterinario}</span>
                      </td>
                      <td className="motive-cell-text">{c.motivo}</td>
                      <td>
                        {c.estado === 'Atendida' && <span className="status-badge gray">Atendida</span>}
                        {(c.estado === 'En Sala de Espera' || c.estado === 'En espera') && (
                          <span className="status-badge yellow">En espera</span>
                        )}
                        {c.estado === 'Programada' && <span className="status-badge aqua">Programada</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {c.estado === 'Atendida' && <span style={{ color: '#94a3b8' }}>—</span>}
                        {(c.estado === 'En Sala de Espera' || c.estado === 'En espera') && (
                          <button type="button" className="btn-file-blue">Ver ficha</button>
                        )}
                        {c.estado === 'Programada' && (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(c.idCita)}
                            className="btn-checkin-orange"
                            title="Registrar presentación física del paciente"
                          >
                            ✓ Check-in
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cola de Espera Médica Real */}
        <section className="clean-panel-box">
          <div className="clean-panel-header">
            <div className="panel-title-flex">
              <span>🏆</span>
              <h2 className="panel-heading">Cola de Espera</h2>
            </div>
            <span className="panel-clock-text">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="queue-list-padding">
            {enEspera.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.85rem' }}>
                No hay pacientes en sala de espera para la fecha seleccionada.
              </div>
            ) : (
              enEspera.map((item, idx) => (
                <div key={item.idCita} className="queue-card-item">
                  <div className="queue-header-row">
                    <div className="queue-title-left">
                      <span className="queue-number-bubble">{idx + 1}</span>
                      <strong className="queue-pet-name">{item.mascota} {item.icono}</strong>
                    </div>
                    {item.horaLlegada && (
                      <span className="wait-badge-normal">
                        Llegó: {item.horaLlegada}
                      </span>
                    )}
                  </div>

                  <div className="queue-owner-desc">{item.dueno} · {item.motivo}</div>
                  <div className="queue-vet-name">👤 {item.veterinario}</div>

                  <div className="queue-btn-group">
                    <button type="button" className="btn-call-patient">🩺 Llamar a consulta</button>
                    <button type="button" className="btn-patient-file">📄 Ficha</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}