import React, { useState, useEffect } from 'react';
import { citasService } from '../modulos/citas/citasService';

export default function Dashboard({ onIrAProgramar, onIniciarConsulta, usuario }) {
  const esRecepcionista = usuario?.rol === 'RECEPCIONISTA';
  const esVeterinario = usuario?.rol === 'VETERINARIO';
  const puedeGestionarLlegadas = esRecepcionista || usuario?.rol === 'ADMIN';
  const idVeterinarioActual = usuario?.idVeterinario;
  const esMiPaciente = (cita) => esVeterinario && idVeterinarioActual != null && String(cita.idVeterinario) === String(idVeterinarioActual);
  const [aviso, setAviso] = useState('');
  const [procesando, setProcesando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [citas, setCitas] = useState([]);
  //const [veterinarios, setVeterinarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // 1. Cargar citas reales del día desde PostgreSQL al montar la pantalla
  const cargarCitasDeBD = async (silencioso = false) => {
    try {
      if (!silencioso) setCargando(true);
      if (!silencioso) setErrorCarga('');
    
      const [dataBD, listaVeterinarios] = await Promise.all([
      citasService.getCitasHoy(),
      citasService.getVeterinarios()
      ]);

      const vets = Array.isArray(listaVeterinarios)
        ? listaVeterinarios
        : [];

     // setVeterinarios(vets);

      const vetsPorId = new Map(
        vets.map(v => [String(v.idVeterinario), v])
      );

      // Mapeo defensivo de los datos devueltos por Spring Boot
      const citasFormateadas = (dataBD || []).map((c) => {
        const vet = vetsPorId.get(String(c.idVeterinario));

        const nombreVeterinario =
          c.nombreVeterinario ||
          c.veterinarioNombre ||
          vet?.nombre ||
          (vet
            ? `${vet.nombres || ''} ${vet.apellidos || ''}`.trim()
            : '') ||
          `Veterinario #${c.idVeterinario}`;

        const horaCorta = c.hora ? String(c.hora).substring(0, 5) : '00:00';
        return {
          idCita: c.idCita,
          id: c.idCita,
          idMascota: c.idMascota,
          idVeterinario: c.idVeterinario,
          hora: horaCorta,
          horaProgramada: horaCorta,
          fecha: c.fecha,
          mascota: c.nombreMascota || `Mascota #${c.idMascota}`,
          icono: '🐾',
          dueno: c.nombrePropietario || 'Propietario no disponible',
         veterinario: nombreVeterinario,
          motivo: c.motivo || 'Consulta médica',
          estado: c.estado || 'Programada',
          horaLlegada: c.horaLlegada ? String(c.horaLlegada).substring(0, 5) : null
        };
      });

      setCitas(citasFormateadas);
    } catch (err) {
      setErrorCarga('No se pudo conectar con el servidor backend (puerto 8080).');
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  useEffect(() => {
    cargarCitasDeBD();
    const intervalo = setInterval(() => cargarCitasDeBD(true), 10000);
    return () => clearInterval(intervalo);
  }, []);

  // 2. HU GCV-6 [CIT-02]: Marcar llegada en PostgreSQL y refrescar el estado
  const handleCheckIn = async (idCita) => {
    if (!puedeGestionarLlegadas || procesando) return;
    setProcesando(idCita);
    try {
      await citasService.registrarCheckIn(idCita);
      setAviso('✓ Check-in registrado. El veterinario asignado verá al paciente en su cola de espera.');
      // Recarga inmediata desde la base de datos
      await cargarCitasDeBD();
    } catch (err) {
      alert(`Error al registrar check-in: ${err.message}`);
    } finally {
      setProcesando(null);
    }
  };

  // GCV-7 [CIT-03]: Actualizar estado de cita
  const handleActualizarEstado = async (idCita, nuevoEstado) => {


    const confirmar = window.confirm(
      `¿Estás seguro de cambiar el estado de la cita a "${nuevoEstado}"?`
    );

    if (!confirmar) return;

    try {
      await citasService.actualizarEstado(idCita, nuevoEstado);
      await cargarCitasDeBD();
    } catch (error) {
      alert(`Error al actualizar la cita: ${error.message}`);
    }
  };

  // GCV-7 [CIT-03]: Llamar al paciente e iniciar consulta
  const handleLlamarAConsulta = async (cita) => {
    if (!esMiPaciente(cita) || procesando) return;
    setProcesando(cita.idCita);
    try {
      // Actualizar el estado en PostgreSQL
      await citasService.actualizarEstado(cita.idCita, 'En Consulta');

      // Actualizar el dashboard
      await cargarCitasDeBD();

      // Abrir el módulo de consultas médicas
      onIniciarConsulta?.({
        ...cita,
        estado: 'En Consulta'
      });

    } catch (error) {
      alert(`Error al llamar a consulta: ${error.message}`);
    } finally {
      setProcesando(null);
    }
  };

  // 3. Métricas calculadas en tiempo real a partir de PostgreSQL
  const totalCitasHoy = citas.length;
  const enEspera = citas.filter((c) => c.estado === 'En Sala de Espera' || c.estado === 'En espera');
  const misPacientesEnEspera = enEspera.filter(esMiPaciente);
  const programadas = citas.filter((c) => c.estado === 'Programada').length;
  const atendidas = citas.filter((c) => c.estado === 'Atendida').length;

  // 4. Filtrado interactivo
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
      {/* 1. Header */}
      <div className="dash-header-clean">
        <div>
          <h1 className="dash-title-clean">Dashboard General</h1>
          <p className="dash-date-clean">
            Sincronizado con PostgreSQL · {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={() => cargarCitasDeBD()} className="btn-outline-action" title="Recargar base de datos">
            🔄 Refrescar
          </button>
          {puedeGestionarLlegadas && <button type="button" className="btn-new-appointment" onClick={onIrAProgramar}>
            <span>+</span> Nueva Cita
          </button>}
        </div>
      </div>

      {errorCarga && (
        <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          ⚠️ {errorCarga}
        </div>
      )}

      {aviso && <div role="status" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: 14, borderRadius: 10, marginBottom: 16, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span>{aviso}</span><button type="button" onClick={() => setAviso('')} aria-label="Cerrar aviso">✕</button>
      </div>}
      {esVeterinario && misPacientesEnEspera.length > 0 && (
        <div role="status" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', padding: 14, borderRadius: 10, marginBottom: 16 }}>
          🟢 Tenés {misPacientesEnEspera.length} paciente(s) asignado(s) esperando atención. Podés atenderlos desde la cola de espera.
        </div>
      )}
      {esVeterinario && idVeterinarioActual == null && (
        <div role="alert" style={{ background: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          Tu cuenta no tiene un veterinario asociado. Solicitá al administrador que revise tu asignación.
        </div>
      )}
      {/* 2. KPIs Dinámicos */}
      <section className="dash-kpi-container">
        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">Citas hoy</span>
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
            <span className="kpi-title-text">Atendidas hoy</span>
            <div className="kpi-number-text">{cargando ? '...' : atendidas}</div>
            <span className="kpi-sub-text">Consultas cerradas</span>
          </div>
          <div className="kpi-avatar-circle circle-blue">🩺</div>
        </div>

        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">Veterinarios activos</span>
            <div className="kpi-number-text text-pink">3</div>
            <span className="kpi-sub-text">Registrados en PostgreSQL</span>
          </div>
          <div className="kpi-avatar-circle circle-pink">👨‍⚕️</div>
        </div>
      </section>

      {/* 3. Panel de Dos Columnas: Citas Reales + Cola de Espera Real */}
      <div className="dash-grid-two">
        {/* Tabla Citas del Día */}
        <section className="clean-panel-box">
          <div className="clean-panel-header">
            <div className="panel-title-flex">
              <span>🗓️</span>
              <h2 className="panel-heading">Citas del Día</h2>
              <span className="panel-tag-aqua">CIT-01</span>
            </div>
            {puedeGestionarLlegadas && <button type="button" className="btn-outline-action" onClick={onIrAProgramar}>
              + Agendar
            </button>}
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
                      Cargando datos desde PostgreSQL...
                    </td>
                  </tr>
                ) : citasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      No hay citas registradas en la base de datos para hoy.
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
                        {c.estado === 'Atendida' && (
                          <span className="status-badge gray">Atendida</span>
                        )}

                        {(c.estado === 'En Sala de Espera' || c.estado === 'En espera') && (
                          <span className="status-badge yellow">En espera</span>
                        )}

                        {puedeGestionarLlegadas && c.estado === 'Programada' && (
                          <span className="status-badge aqua">Programada</span>
                        )}

                        {c.estado === 'Cancelada' && (
                          <span className="status-badge" style={{
                            background: '#fee2e2',
                            color: '#b91c1c'
                          }}>
                            Cancelada
                          </span>
                        )}

                        {c.estado === 'No Asistió' && (
                          <span className="status-badge" style={{
                            background: '#fef3c7',
                            color: '#92400e'
                          }}>
                            No asistió
                          </span>
                        )}

                        {c.estado === 'En Consulta' && (
                          <span className="status-badge" style={{
                            background: '#dbeafe',
                            color: '#1d4ed8'
                          }}>
                            En consulta
                          </span>
                        )}
                      </td>

                     
                                            
                        <td className="cita-acciones-celda">
                          <div className="cita-acciones">

                            {puedeGestionarLlegadas && c.estado === 'Programada' && (
                              <button
                                type="button"
                                onClick={() => handleCheckIn(c.idCita)}
                                disabled={procesando === c.idCita}
                                className="btn-checkin-orange"
                              >
                                ✓ Check-in
                              </button>
                            )}

                            {(c.estado === 'En Sala de Espera' ||
                              c.estado === 'En espera') && (
                              <span className="cita-sin-acciones">En espera</span>
                            )}

                            {puedeGestionarLlegadas && (c.estado === 'Programada' ||
                              c.estado === 'En Sala de Espera' ||
                              c.estado === 'En espera') && (
                              <details className="cita-menu">
                                <summary className="cita-menu-trigger">
                                  ⋯ Acciones
                                </summary>

                                <div className="cita-menu-opciones">
                                  <button
                                    type="button"
                                    className="cita-menu-item"
                                    onClick={(e) => {
                                      e.currentTarget.closest('details').open = false;
                                      handleActualizarEstado(c.idCita, 'No Asistió');
                                    }}
                                  >
                                    ◷ No asistió
                                  </button>

                                  <button
                                    type="button"
                                    className="cita-menu-item cita-menu-danger"
                                    onClick={(e) => {
                                      e.currentTarget.closest('details').open = false;
                                      handleActualizarEstado(c.idCita, 'Cancelada');
                                    }}
                                  >
                                    ⊘ Cancelar cita
                                  </button>
                                </div>
                              </details>
                            )}

                            {['Atendida', 'Cancelada', 'No Asistió', 'En Consulta'].includes(c.estado) && (
                              <span className="cita-sin-acciones">—</span>
                            )}

                          </div>
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
              <span className="panel-tag-aqua">CIT-02</span>
            </div>
            <span className="panel-clock-text">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="queue-list-padding">
            {enEspera.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.85rem' }}>
                No hay pacientes en sala de espera en este momento.
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
                    
                  {esMiPaciente(item) && <button
                    type="button"
                    className="btn-call-patient"
                    style={{ background: '#16a34a', color: 'white' }}
                    disabled={procesando === item.idCita}
                    onClick={() => handleLlamarAConsulta(item)}
                  >
                    🩺 {procesando === item.idCita ? 'Iniciando...' : 'Atender paciente'}
                  </button>}

                    <span style={{ fontSize: 12, color: "#64748b" }}>{esMiPaciente(item) ? "Asignado a vos" : "Esperando al veterinario asignado"}</span>
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