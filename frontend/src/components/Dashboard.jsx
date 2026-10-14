import React, { useState } from 'react';

export default function Dashboard({ citasData, setCitasData, onIrAProgramar }) {
  const [busqueda, setBusqueda] = useState('');

  // Datos base de respaldo si no vienen por props
  const [citasLocales, setCitasLocales] = useState([
    { id: 1, hora: '08:00', fecha: '2026-10-13', mascota: 'Max', icono: '🐶', dueno: 'María Rodríguez', vet: 'Dr. Morales', motivo: 'Consulta general', estado: 'Atendida', espera: null },
    { id: 2, hora: '09:00', fecha: '2026-10-13', mascota: 'Luna', icono: '🐱', dueno: 'Ana Martínez', vet: 'Dra. García', motivo: 'Control rutina', estado: 'En espera', espera: '23 min esperando', alerta: true },
    { id: 3, hora: '10:00', fecha: '2026-10-13', mascota: 'Rocky', icono: '🐩', dueno: 'Carlos López', vet: 'Dr. Morales', motivo: 'Vacunación', estado: 'En espera', espera: '8 min esperando', alerta: false },
    { id: 4, hora: '10:30', fecha: '2026-10-13', mascota: 'Pico', icono: '🦜', dueno: 'José Pérez', vet: 'Dr. Santos', motivo: 'Revisión anual', estado: 'En espera', espera: '8 min esperando', alerta: false },
    { id: 5, hora: '11:00', fecha: '2026-10-13', mascota: 'Miel', icono: '🐱', dueno: 'Laura Hernández', vet: 'Dra. García', motivo: 'Desparasitación', estado: 'Programada', espera: null },
    { id: 6, hora: '14:00', fecha: '2026-10-13', mascota: 'Max', icono: '🐶', dueno: 'María Rodríguez', vet: 'Dr. Santos', motivo: 'Seguimiento', estado: 'Programada', espera: null }
  ]);

  // Selección de fuente de datos (compartida o local)
  const citas = citasData || citasLocales;
  const setCitas = setCitasData || setCitasLocales;

  // Acción para ir a programar cita (CIT-01)
  const handleNavegarProgramar = () => {
    if (onIrAProgramar) {
      onIrAProgramar();
    } else {
      alert("Navegando a la vista de programar cita...");
    }
  };

  // Check-in físico de paciente a la clínica (CIT-02)
  const handleCheckIn = (id) => {
    setCitas(prev =>
      prev.map(c => (c.id === id ? { ...c, estado: 'En espera', espera: 'Recién llegado' } : c))
    );
  };

  const colaEspera = citas.filter(c => c.estado === 'En espera');

  // Filtrado reactivo en tiempo real
  const citasFiltradas = citas.filter(c => {
    const term = busqueda.toLowerCase();
    const pet = (c.mascota || '').toLowerCase();
    const owner = (c.dueno || c.propietario || '').toLowerCase();
    const motive = (c.motivo || '').toLowerCase();
    return pet.includes(term) || owner.includes(term) || motive.includes(term);
  });

  return (
    <div className="dash-white-layout">
      {/* 1. Header del Dashboard */}
      <div className="dash-header-clean">
        <div>
          <h1 className="dash-title-clean">Dashboard General</h1>
          <p className="dash-date-clean">martes, 13 de octubre de 2026</p>
        </div>
        <button 
          type="button"
          className="btn-new-appointment" 
          onClick={handleNavegarProgramar}
        >
          <span>+</span> Nueva Cita
        </button>
      </div>

      {/* 2. KPIs Blancos con Iconos Aqua */}
      <section className="dash-kpi-container">
        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">Citas hoy</span>
            <div className="kpi-number-text">{citas.length}</div>
            <span className="kpi-sub-text">
              {citas.filter(c => c.estado === 'Programada').length} programadas · {colaEspera.length} en espera
            </span>
          </div>
          <div className="kpi-avatar-circle circle-aqua">🗓️</div>
        </div>

        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">En sala de espera</span>
            <div className="kpi-number-text text-aqua">{colaEspera.length}</div>
            <span className="kpi-sub-text">Esperando ser llamados</span>
          </div>
          <div className="kpi-avatar-circle circle-amber">⏳</div>
        </div>

        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">Mascotas registradas</span>
            <div className="kpi-number-text">47</div>
            <span className="kpi-sub-text">+3 este mes</span>
          </div>
          <div className="kpi-avatar-circle circle-blue">🐾</div>
        </div>

        <div className="kpi-card-white">
          <div className="kpi-info-box">
            <span className="kpi-title-text">Vacunas vencidas</span>
            <div className="kpi-number-text text-pink">3</div>
            <span className="kpi-sub-text">Requieren atención</span>
          </div>
          <div className="kpi-avatar-circle circle-pink">💉</div>
        </div>
      </section>

      {/* 3. Panel de Dos Columnas: Citas + Cola de Espera */}
      <div className="dash-grid-two">
        {/* Tabla Citas del Día */}
        <section className="clean-panel-box">
          <div className="clean-panel-header">
            <div className="panel-title-flex">
              <span>🗓️</span>
              <h2 className="panel-heading">Citas del Día</h2>
              <span className="panel-tag-aqua">CIT-01</span>
            </div>
            <button 
              type="button"
              className="btn-outline-action" 
              onClick={handleNavegarProgramar}
            >
              + Agendar
            </button>
          </div>

          <div className="panel-search-padding">
            <input
              type="text"
              placeholder="Buscar por mascota, propietario o motivo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="table-search-input"
            />
          </div>

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
              {citasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No se encontraron citas registradas con ese criterio.
                  </td>
                </tr>
              ) : (
                citasFiltradas.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span className="pill-hour-aqua">{c.hora}</span>
                    </td>
                    <td>
                      <div className="pet-cell-flex">
                        <span className="pet-icon-bubble">{c.icono || '🐾'}</span>
                        <div>
                          <strong className="pet-name-title">{c.mascota}</strong>
                          <div className="owner-subtitle">{c.dueno || c.propietario}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="vet-cell-pill">{c.vet || c.veterinario}</span>
                    </td>
                    <td className="motive-cell-text">{c.motivo}</td>
                    <td>
                      {c.estado === 'Atendida' && <span className="status-badge gray">Atendida</span>}
                      {c.estado === 'En espera' && <span className="status-badge yellow">En espera</span>}
                      {c.estado === 'Programada' && <span className="status-badge aqua">Programada</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {c.estado === 'Atendida' && <span style={{ color: '#94a3b8' }}>—</span>}
                      {c.estado === 'En espera' && (
                        <button type="button" className="btn-file-blue">📄 Ver ficha</button>
                      )}
                      {c.estado === 'Programada' && (
                        <button 
                          type="button"
                          onClick={() => handleCheckIn(c.id)} 
                          className="btn-checkin-orange"
                          title="Registrar presentación del paciente (CIT-02)"
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
        </section>

        {/* Cola de Espera Médica */}
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
            {colaEspera.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.85rem' }}>
                No hay pacientes en sala de espera en este momento.
              </div>
            ) : (
              colaEspera.map((item, idx) => (
                <div key={item.id} className="queue-card-item">
                  <div className="queue-header-row">
                    <div className="queue-title-left">
                      <span className="queue-number-bubble">{idx + 1}</span>
                      <strong className="queue-pet-name">{item.mascota} {item.icono || '🐾'}</strong>
                    </div>
                    {item.espera && (
                      <span className={item.alerta ? 'wait-badge-warn' : 'wait-badge-normal'}>
                        {item.alerta && '⚠️ '} {item.espera}
                      </span>
                    )}
                  </div>

                  <div className="queue-owner-desc">{item.dueno || item.propietario} · {item.motivo}</div>
                  <div className="queue-vet-name">👤 {item.vet || item.veterinario}</div>

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

      {/* 4. Actividad Reciente */}
      <section className="clean-panel-box" style={{ marginTop: '20px' }}>
        <div className="clean-panel-header">
          <div className="panel-title-flex">
            <span>📊</span>
            <h2 className="panel-heading">Actividad Reciente</h2>
            <span className="panel-tag-aqua">HIS-01</span>
          </div>
        </div>

        <div className="activity-padding">
          <div className="activity-item-line">
            <span className="timeline-dot-clean dot-aqua"></span>
            <div>
              <div className="activity-headline"><strong>Consulta completada</strong> — Max (Golden Retriever)</div>
              <div className="activity-desc">Dr. Morales · Consulta general · Sin novedad</div>
              <div className="activity-timestamp">Hoy, 09:15</div>
            </div>
          </div>

          <div className="activity-item-line">
            <span className="timeline-dot-clean dot-blue"></span>
            <div>
              <div className="activity-headline"><strong>Check-in registrado</strong> — Luna (Siamés)</div>
              <div className="activity-desc">Llegó a las 10:03 · En sala de espera</div>
              <div className="activity-timestamp">Hoy, 10:03</div>
            </div>
          </div>

          <div className="activity-item-line border-none">
            <span className="timeline-dot-clean dot-amber"></span>
            <div>
              <div className="activity-headline"><strong>Vacuna aplicada</strong> — Rocky (Poodle)</div>
              <div className="activity-desc">Rabia · Dra. García · Próxima dosis: en 1 año</div>
              <div className="activity-timestamp">Ayer, 14:30</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}