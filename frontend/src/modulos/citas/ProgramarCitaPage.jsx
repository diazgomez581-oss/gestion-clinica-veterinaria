import React, { useState } from 'react';

// Base de datos precargada de Propietarios y sus Mascotas registradas
const PROPIETARIOS_REGISTRADOS = [
  {
    id: 1,
    nombre: 'Carlos Pérez',
    dui: '05123456-7',
    telefono: '7845-1234',
    mascotas: [
      { idMascota: 101, nombre: 'Max', especie: 'Canino', raza: 'Golden Retriever', exp: 'EXP-0084', icono: '🐶' }
    ]
  },
  {
    id: 2,
    nombre: 'María Gómez',
    dui: '02345678-9',
    telefono: '7123-4567',
    mascotas: [
      { idMascota: 102, nombre: 'Luna', especie: 'Felino', raza: 'Siamés', exp: 'EXP-0042', icono: '🐱' },
      { idMascota: 104, nombre: 'Michi', especie: 'Felino', raza: 'Persa', exp: 'EXP-0099', icono: '🐱' }
    ]
  },
  {
    id: 3,
    nombre: 'Juan López',
    dui: '04876543-2',
    telefono: '7999-8877',
    mascotas: [
      { idMascota: 103, nombre: 'Rocky', especie: 'Canino', raza: 'Pastor Alemán', exp: 'EXP-0115', icono: '🐩' }
    ]
  },
  {
    id: 4,
    nombre: 'José Pérez',
    dui: '01987654-3',
    telefono: '7654-3210',
    mascotas: [
      { idMascota: 105, nombre: 'Pico', especie: 'Ave', raza: 'Perico Australiano', exp: 'EXP-0201', icono: '🦜' }
    ]
  },
  {
    id: 5,
    nombre: 'Laura Hernández',
    dui: '03456789-1',
    telefono: '7012-3456',
    mascotas: [
      { idMascota: 106, nombre: 'Miel', especie: 'Felino', raza: 'Angora', exp: 'EXP-0310', icono: '🐱' }
    ]
  }
];

const VETERINARIOS = [
  { id: 'VET-01', nombre: 'Dr. Daniel Solano', consultorio: 'Consultorio 1', especialidad: 'Medicina General y Cirugía' },
  { id: 'VET-02', nombre: 'Dr. Carlos Rodríguez', consultorio: 'Consultorio 2', especialidad: 'Inmunización y Preventiva' },
  { id: 'VET-03', nombre: 'Dra. García', consultorio: 'Consultorio 3', especialidad: 'Felinos y Animales Menores' },
  { id: 'VET-04', nombre: 'Dr. Santos', consultorio: 'Consultorio 4', especialidad: 'Diagnóstico y Triaje' },
];

const BLOQUES_HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'
];

export default function ProgramarCitaPage({ onCitaGuardada, onVolver, citasExistentes = [] }) {
  const hoyStr = new Date().toISOString().split('T')[0];

  // Estados del Buscador de Propietario
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [propietarioSeleccionado, setPropietarioSeleccionado] = useState(null);
  const [mascotasDisponibles, setMascotasDisponibles] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

  // Estado del Formulario
  const [formulario, setFormulario] = useState({
    veterinario: VETERINARIOS[0].nombre,
    fecha: hoyStr,
    hora: '09:00',
    tipoServicio: 'Consulta general',
    motivo: '',
    notas: ''
  });

  const [errorValidacion, setErrorValidacion] = useState('');
  const [exitoMensaje, setExitoMensaje] = useState(false);

  // Filtro reactivo para el autocompletado
  const propietariosFiltrados = terminoBusqueda.trim() === ''
    ? []
    : PROPIETARIOS_REGISTRADOS.filter(p =>
        p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        p.dui.includes(terminoBusqueda)
      );

  // Al seleccionar un dueño de la lista desplegable
  const handleSeleccionarPropietario = (prop) => {
    setPropietarioSeleccionado(prop);
    setTerminoBusqueda(prop.nombre);
    setMascotasDisponibles(prop.mascotas);

    // Por defecto toma la primera mascota del dueño
    if (prop.mascotas && prop.mascotas.length > 0) {
      setMascotaSeleccionada(prop.mascotas[0]);
    } else {
      setMascotaSeleccionada(null);
    }
    if (errorValidacion) setErrorValidacion('');
  };

  // Cambio manual de mascota si el dueño tiene más de una
  const handleCambioMascota = (e) => {
    const idSel = parseInt(e.target.value, 10);
    const m = mascotasDisponibles.find(item => item.idMascota === idSel);
    setMascotaSeleccionada(m);
  };

  const estaHoraOcupada = (horaEvaluar) => {
    return citasExistentes.some(c =>
      c.estado !== 'Cancelada' &&
      (c.fecha === formulario.fecha || !c.fecha) &&
      (c.veterinario === formulario.veterinario || c.vet === formulario.veterinario) &&
      (c.hora === horaEvaluar || c.horaProgramada === horaEvaluar)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!propietarioSeleccionado) {
      setErrorValidacion('Debes buscar y seleccionar un propietario registrado en el sistema.');
      return;
    }

    if (!mascotaSeleccionada) {
      setErrorValidacion('El propietario seleccionado debe tener al menos una mascota vinculada.');
      return;
    }

    if (!formulario.motivo.trim()) {
      setErrorValidacion('Por favor ingresa el motivo breve de la consulta.');
      return;
    }

    // Regla de Negocio RN-02 (Anti-traslape)
    if (estaHoraOcupada(formulario.hora)) {
      setErrorValidacion(`Conflicto de Agenda (RN-02): El ${formulario.veterinario} ya tiene ocupada la hora ${formulario.hora}. Selecciona otro bloque.`);
      return;
    }

    const nuevaCita = {
      id: Date.now(),
      hora: formulario.hora,
      fecha: formulario.fecha,
      codigoExpediente: mascotaSeleccionada.exp,
      mascota: mascotaSeleccionada.nombre,
      icono: mascotaSeleccionada.icono,
      dueno: propietarioSeleccionado.nombre,
      propietario: propietarioSeleccionado.nombre,
      dui: propietarioSeleccionado.dui,
      telefono: propietarioSeleccionado.telefono,
      vet: formulario.veterinario,
      veterinario: formulario.veterinario,
      motivo: formulario.motivo,
      tipoServicio: formulario.tipoServicio,
      estado: 'Programada', // Criterio inicial CIT-01
      espera: null,
      tiempoEspera: null
    };

    if (onCitaGuardada) {
      onCitaGuardada(nuevaCita);
    }

    setExitoMensaje(true);
    setTimeout(() => {
      if (onVolver) onVolver();
    }, 1100);
  };

  return (
    <div className="cita-page-container">
      {/* Header */}
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link">Dashboard</span> &gt; <span>Programación de Citas</span>
          </div>
          <h1 className="cita-page-title">Agendar Nueva Cita Médica</h1>
          <p className="cita-page-sub">Historia GCV-5 [CIT-01] · Selección de cliente existente y mascota vinculada</p>
        </div>

        <button type="button" onClick={onVolver} className="btn-volver-dash">
          ← Volver al Dashboard
        </button>
      </div>

      {exitoMensaje && (
        <div className="alert-banner-success">
          ✓ Cita médica programada exitosamente con estado <strong>"Programada"</strong>. Redirigiendo al Dashboard...
        </div>
      )}

      {errorValidacion && (
        <div className="alert-banner-danger">
          ⚠️ {errorValidacion}
        </div>
      )}

      <form onSubmit={handleSubmit} className="cita-form-layout">
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div className="cita-form-main">
          {/* Tarjeta 1: Buscador de Propietario y Paciente Vinculado */}
          <div className="cita-card-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 className="section-title-aqua" style={{ margin: 0, border: 'none', padding: 0 }}>
                1. Selección de Propietario y Mascota
              </h3>
              <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                RN-01: Propietario Existente
              </span>
            </div>

            {/* BUSCADOR DE PROPIETARIOS EN TIEMPO REAL */}
            <div className="search-propietario-box">
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                Buscar Propietario Registrado (por Nombre o DUI) *
              </label>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <input
                  type="text"
                  placeholder="Escribe para buscar... Ej. Carlos, María, 0512..."
                  value={terminoBusqueda}
                  onChange={(e) => {
                    setTerminoBusqueda(e.target.value);
                    if (propietarioSeleccionado && e.target.value !== propietarioSeleccionado.nombre) {
                      setPropietarioSeleccionado(null);
                      setMascotasDisponibles([]);
                      setMascotaSeleccionada(null);
                    }
                  }}
                  className="input-search-prop"
                />

                {/* Lista Flotante de Resultados */}
                {propietariosFiltrados.length > 0 && !propietarioSeleccionado && (
                  <div className="dropdown-prop-results">
                    {propietariosFiltrados.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSeleccionarPropietario(p)}
                        className="prop-result-item"
                      >
                        <div>
                          <strong>{p.nombre}</strong>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '8px' }}>DUI: {p.dui}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#0891b2', fontWeight: 600 }}>
                          🐾 {p.mascotas.length} mascota(s)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* DATOS AUTO-COMPLETADOS (Solo lectura para no volver a escribir) */}
            <div className="fields-grid-2" style={{ marginTop: '16px' }}>
              <div className="input-group-vet">
                <label>DUI del Propietario</label>
                <input
                  type="text"
                  value={propietarioSeleccionado ? propietarioSeleccionado.dui : 'Pendiente de selección...'}
                  disabled
                  className="input-disabled-clean"
                />
              </div>

              <div className="input-group-vet">
                <label>Teléfono de Contacto</label>
                <input
                  type="text"
                  value={propietarioSeleccionado ? propietarioSeleccionado.telefono : 'Pendiente de selección...'}
                  disabled
                  className="input-disabled-clean"
                />
              </div>

              {/* SELECTOR DE MASCOTAS VINCULADAS AL DUEÑO */}
              <div className="input-group-vet">
                <label>Mascota Vinculada a Atender *</label>
                <select
                  disabled={!propietarioSeleccionado || mascotasDisponibles.length === 0}
                  value={mascotaSeleccionada ? mascotaSeleccionada.idMascota : ''}
                  onChange={handleCambioMascota}
                  style={{ fontWeight: 600 }}
                >
                  {mascotasDisponibles.length === 0 ? (
                    <option value="">Selecciona primero un propietario...</option>
                  ) : (
                    mascotasDisponibles.map(m => (
                      <option key={m.idMascota} value={m.idMascota}>
                        {m.icono} {m.nombre} ({m.especie} - {m.raza})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="input-group-vet">
                <label>Código de Expediente Clínico</label>
                <input
                  type="text"
                  value={mascotaSeleccionada ? mascotaSeleccionada.exp : '---'}
                  disabled
                  className="input-disabled-clean"
                  style={{ fontWeight: 700, color: '#0369a1' }}
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Médico y Horarios */}
          <div className="cita-card-section">
            <h3 className="section-title-aqua">2. Especialista y Horario de Atención</h3>

            <div className="fields-grid-2">
              <div className="input-group-vet">
                <label>Médico Veterinario Tratante *</label>
                <select
                  name="veterinario"
                  value={formulario.veterinario}
                  onChange={(e) => setFormulario(prev => ({ ...prev, veterinario: e.target.value }))}
                >
                  {VETERINARIOS.map(v => (
                    <option key={v.id} value={v.nombre}>
                      {v.nombre} — {v.consultorio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group-vet">
                <label>Fecha de la Cita *</label>
                <input
                  type="date"
                  name="fecha"
                  value={formulario.fecha}
                  min={hoyStr}
                  onChange={(e) => setFormulario(prev => ({ ...prev, fecha: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Selector de bloques horarios */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                Selecciona la hora de atención (Bloques de 30 min):
              </label>
              
              <div className="time-slots-grid">
                {BLOQUES_HORARIOS.map(slot => {
                  const ocupada = estaHoraOcupada(slot);
                  const elegida = formulario.hora === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={ocupada}
                      onClick={() => setFormulario(prev => ({ ...prev, hora: slot }))}
                      className={`time-slot-btn ${ocupada ? 'slot-occupied' : elegida ? 'slot-selected' : 'slot-available'}`}
                    >
                      <span>{slot}</span>
                      <small>{ocupada ? 'Ocupado' : elegida ? 'Elegido' : 'Libre'}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Motivo */}
          <div className="cita-card-section">
            <h3 className="section-title-aqua">3. Motivo Clínico de Consulta</h3>

            <div className="fields-grid-2">
              <div className="input-group-vet">
                <label>Tipo de Servicio *</label>
                <select
                  name="tipoServicio"
                  value={formulario.tipoServicio}
                  onChange={(e) => setFormulario(prev => ({ ...prev, tipoServicio: e.target.value }))}
                >
                  <option value="Consulta general">🩺 Consulta general</option>
                  <option value="Vacunación">💉 Vacunación</option>
                  <option value="Desparasitación">💊 Desparasitación</option>
                  <option value="Control de rutina">📋 Control de rutina</option>
                  <option value="Seguimiento / Curación">🩹 Seguimiento / Curación</option>
                  <option value="Cirugía menor">🏥 Cirugía menor</option>
                </select>
              </div>

              <div className="input-group-vet">
                <label>Motivo Breve de la Cita *</label>
                <input
                  type="text"
                  placeholder="Ej. Chequeo anual, cojera en pata delantera..."
                  value={formulario.motivo}
                  onChange={(e) => setFormulario(prev => ({ ...prev, motivo: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Ficha de Resumen en Vivo */}
        <div className="cita-summary-side">
          <div className="summary-card-sticky">
            <div className="summary-card-header">
              <h4>Resumen de la Cita</h4>
              <span className="summary-badge-status">Programada</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Responsable</span>
              <strong className="summary-val">
                {propietarioSeleccionado ? propietarioSeleccionado.nombre : 'Sin seleccionar'}
              </strong>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                DUI: {propietarioSeleccionado ? propietarioSeleccionado.dui : '---'}
              </div>
            </div>

            <div className="summary-item">
              <span className="summary-label">Paciente</span>
              <div className="summary-val">
                {mascotaSeleccionada ? (
                  <span>{mascotaSeleccionada.icono} {mascotaSeleccionada.nombre} ({mascotaSeleccionada.especie})</span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>Selecciona una mascota</span>
                )}
              </div>
              <small style={{ color: '#0369a1', fontWeight: 700 }}>
                {mascotaSeleccionada ? mascotaSeleccionada.exp : ''}
              </small>
            </div>

            <div className="summary-item">
              <span className="summary-label">Médico Tratante</span>
              <div className="summary-val text-aqua-bold">{formulario.veterinario}</div>
            </div>

            <div className="summary-item">
              <span className="summary-label">Horario Reservado</span>
              <div className="summary-val">{formulario.fecha} a las <strong>{formulario.hora}</strong></div>
            </div>

            <div className="summary-item">
              <span className="summary-label">Servicio</span>
              <div className="summary-val">{formulario.tipoServicio}</div>
            </div>

            <hr className="summary-divider" />

            <div className="summary-actions">
              <button type="submit" className="btn-confirm-save">
                ✓ Confirmar y Agendar Cita
              </button>
              <button type="button" onClick={onVolver} className="btn-cancel-flat">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}