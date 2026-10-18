import React, { useState, useEffect } from 'react';
import { citasService } from './citasService';

// Datos de respaldo por si la BD tarda en responder
const PROPIETARIOS_BASE = [];
const VETERINARIOS_DEFAULT = [
  { idVeterinario: 1, nombre: 'Dr. Daniel Solano', consultorio: 'Consultorio 1' },
  { idVeterinario: 2, nombre: 'Dr. Carlos Rodríguez', consultorio: 'Consultorio 2' },
  { idVeterinario: 3, nombre: 'Dra. María Santos', consultorio: 'Consultorio 3' }
];

const BLOQUES_HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'
];

export default function ProgramarCitaPage({ onCitaGuardada, onVolver, citasExistentes = [] }) {
  const obtenerFechaHoyLocal = () => {
    const d = new Date();
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const hoyStr = obtenerFechaHoyLocal();

  // Estados de datos de la base de datos
  const [listaPropietarios, setListaPropietarios] = useState(PROPIETARIOS_BASE);
  const [listaVeterinarios, setListaVeterinarios] = useState(VETERINARIOS_DEFAULT);
  
  // Estados del Buscador y Selección
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [propietarioSeleccionado, setPropietarioSeleccionado] = useState(null);
  const [mascotasDisponibles, setMascotasDisponibles] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

  // Estado del Formulario
  const [formulario, setFormulario] = useState({
    idVeterinario: 1,
    veterinario: VETERINARIOS_DEFAULT[0].nombre,
    fecha: hoyStr,
    hora: '09:00',
    tipoServicio: 'Consulta general',
    motivo: '',
    notas: ''
  });

  const [errorValidacion, setErrorValidacion] = useState('');
  const [exitoMensaje, setExitoMensaje] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Sincronizar Propietarios, Mascotas y Veterinarios reales desde PostgreSQL al cargar
  useEffect(() => {
    async function cargarCatalogosDesdeBD() {
      // 1. Cargar Veterinarios
      const vetsBD = await citasService.getVeterinarios();
      if (vetsBD && Array.isArray(vetsBD) && vetsBD.length > 0) {
        const vetsMapeados = vetsBD.map(v => ({
          idVeterinario: v.idVeterinario || v.id,
          nombre: v.nombre,
          consultorio: `Consultorio ${v.idVeterinario || v.id}`
        }));
        setListaVeterinarios(vetsMapeados);
        setFormulario(prev => ({
          ...prev,
          idVeterinario: vetsMapeados[0].idVeterinario,
          veterinario: vetsMapeados[0].nombre
        }));
      }

      // 2. Cargar Propietarios y Mascotas cruzadas
      const propsBD = await citasService.getPropietarios();
      const mascBD = await citasService.getMascotas();

      if (propsBD && Array.isArray(propsBD) && propsBD.length > 0) {
        const dueñosConMascotas = propsBD.map(p => {
          const idProp = p.idPropietario || p.id;
          
          // Extraer las mascotas del dueño (ya sea de la relación anidada o filtrando de la lista de mascotas)
          let mascotasCrudas = [];
          if (p.mascotas && Array.isArray(p.mascotas) && p.mascotas.length > 0) {
            mascotasCrudas = p.mascotas;
          } else if (mascBD && Array.isArray(mascBD)) {
            mascotasCrudas = mascBD.filter(m => (m.idPropietario || (m.propietario && m.propietario.idPropietario)) === idProp);
          }

          const susMascotas = mascotasCrudas.map(m => ({
            idMascota: m.idMascota || m.id,
            nombre: m.nombre,
            especie: m.especie || 'Canino',
            raza: m.raza || 'Estándar',
            exp: m.codigoExpediente || `EXP-2026-${String(m.idMascota || m.id).padStart(3, '0')}`,
            icono: m.especie === 'Felino' ? '🐱' : '🐶'
          }));

          return {
            id: idProp,
            nombre: `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.nombre,
            dui: p.dui,
            telefono: p.telefono,
            mascotas: susMascotas
          };
        });
        setListaPropietarios(dueñosConMascotas);
      }
    }
    cargarCatalogosDesdeBD();
  }, []);

  // Filtro reactivo para el autocompletado del buscador
  const propietariosFiltrados = terminoBusqueda.trim() === ''
    ? []
    : listaPropietarios.filter(p =>
        p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        (p.dui && p.dui.includes(terminoBusqueda))
      );

  const handleSeleccionarPropietario = (prop) => {
    setPropietarioSeleccionado(prop);
    setTerminoBusqueda(prop.nombre);
    setMascotasDisponibles(prop.mascotas || []);

    if (prop.mascotas && prop.mascotas.length > 0) {
      setMascotaSeleccionada(prop.mascotas[0]);
    } else {
      setMascotaSeleccionada(null);
    }
    if (errorValidacion) setErrorValidacion('');
  };

  const handleCambioMascota = (e) => {
    const idSel = parseInt(e.target.value, 10);
    const m = mascotasDisponibles.find(item => item.idMascota === idSel);
    setMascotaSeleccionada(m);
  };

  const estaHoraOcupada = (horaEvaluar) => {
    return citasExistentes.some(c =>
      c.estado !== 'Cancelada' &&
      (c.fecha === formulario.fecha || !c.fecha) &&
      (c.idVeterinario === formulario.idVeterinario || c.veterinario === formulario.veterinario || c.vet === formulario.veterinario) &&
      (c.hora === horaEvaluar || c.horaProgramada === horaEvaluar)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorValidacion('');

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

    if (!formulario.fecha) {
      setErrorValidacion('La fecha seleccionada no es válida.');
      return;
    }

    // Regla de Negocio RN-02 (Anti-traslape)
    if (estaHoraOcupada(formulario.hora)) {
      setErrorValidacion(`Conflicto de Agenda (RN-02): El ${formulario.veterinario} ya tiene ocupada la hora ${formulario.hora}. Selecciona otro bloque.`);
      return;
    }

    // Payload exacto hacia la entidad Cita.java y base de datos
    const payloadBackend = {
      fecha: String(formulario.fecha).trim(), // Envío estricto en formato YYYY-MM-DD
      hora: formulario.hora.length === 5 ? `${formulario.hora}:00` : formulario.hora,
      motivo: `${formulario.tipoServicio} - ${formulario.motivo.trim()}`,
      estado: 'Programada',
      horaLlegada: null,
      idMascota: Number(mascotaSeleccionada.idMascota),
      idVeterinario: Number(formulario.idVeterinario)
    };

    try {
      setGuardando(true);
      const citaGuardada = await citasService.guardarCita(payloadBackend);

      // Objeto formateado para actualizar el estado del Dashboard visualmente de inmediato
      const nuevaCitaUI = {
        id: citaGuardada.idCita || Date.now(),
        idCita: citaGuardada.idCita || Date.now(),
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
        estado: 'Programada',
        idVeterinario: formulario.idVeterinario,
        idMascota: mascotaSeleccionada.idMascota
      };

      if (onCitaGuardada) {
        onCitaGuardada(nuevaCitaUI);
      }

      setExitoMensaje(true);
      setTimeout(() => {
        if (onVolver) onVolver();
      }, 1200);
    } catch (err) {
      setErrorValidacion(err.message || 'Error al conectar con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="cita-page-container">
      {/* Header */}
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link" style={{ cursor: 'pointer' }}>Dashboard</span> &gt; <span>Programación de Citas</span>
          </div>
          <h1 className="cita-page-title">Agendar Nueva Cita Médica</h1>
          <p className="cita-page-sub">Historia GCV-5 [CIT-01] · Asignación de paciente y registro en PostgreSQL</p>
        </div>

        <button type="button" onClick={onVolver} className="btn-volver-dash">
          ← Volver al Dashboard
        </button>
      </div>

      {exitoMensaje && (
        <div className="alert-banner-success" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          ✓ Cita médica guardada con éxito en la base de datos (Fecha: {formulario.fecha}). Redirigiendo al Dashboard...
        </div>
      )}

      {errorValidacion && (
        <div className="alert-banner-danger" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
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
                PostgreSQL · Tablas Propietarios y Mascotas
              </span>
            </div>

            {/* BUSCADOR */}
            <div className="search-propietario-box">
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                Buscar Propietario Registrado (Nombre o DUI) *
              </label>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <input
                  type="text"
                  placeholder="Escribe para buscar... Ej. Carlos, Lucía, 0512..."
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
                  <div className="dropdown-prop-results" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                    {propietariosFiltrados.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSeleccionarPropietario(p)}
                        className="prop-result-item"
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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

            {/* DATOS AUTO-COMPLETADOS */}
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

              {/* SELECTOR DE MASCOTAS VINCULADAS */}
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
                  value={formulario.idVeterinario}
                  onChange={(e) => {
                    const idSel = parseInt(e.target.value, 10);
                    const vSel = listaVeterinarios.find(v => v.idVeterinario === idSel);
                    setFormulario(prev => ({
                      ...prev,
                      idVeterinario: idSel,
                      veterinario: vSel ? vSel.nombre : ''
                    }));
                  }}
                >
                  {listaVeterinarios.map(v => (
                    <option key={v.idVeterinario} value={v.idVeterinario}>
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
              <span className="summary-label">Fecha y Hora</span>
              <div className="summary-val">{formulario.fecha} a las <strong>{formulario.hora}</strong></div>
            </div>

            <div className="summary-item">
              <span className="summary-label">Servicio</span>
              <div className="summary-val">{formulario.tipoServicio}</div>
            </div>

            <hr className="summary-divider" />

            <div className="summary-actions">
              <button type="submit" className="btn-confirm-save" disabled={guardando}>
                {guardando ? 'Guardando en BD...' : '✓ Confirmar y Agendar Cita'}
              </button>
              <button type="button" onClick={onVolver} className="btn-cancel-flat" disabled={guardando}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}