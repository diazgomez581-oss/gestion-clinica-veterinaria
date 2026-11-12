import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CircleCheck, PawPrint, TriangleAlert } from 'lucide-react';
import { citasService } from './citasService';
// Bloques de 30 minutos. El bloque de 21:00 termina a las 21:30.
const generarBloques = (inicio, fin) => {
  const aMinutos = hora => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  };
  const resultado = [];
  for (let n = aMinutos(inicio); n <= aMinutos(fin); n += 30) {
    resultado.push(`${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`);
  }
  return resultado;
};
const BLOQUES_HORARIOS = [
  ...generarBloques('08:00', '11:30'),
  ...generarBloques('14:00', '21:00')
];

export default function ProgramarCitaPage({ onCitaGuardada, onVolver, refuerzoInicial = null}) {
    const esCitaDeRefuerzo = refuerzoInicial != null;
    const obtenerFechaHoyLocal = () => {
    const d = new Date();
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const hoyStr = obtenerFechaHoyLocal();

  // Estados de datos de la base de datos
  const [listaPropietarios, setListaPropietarios] = useState([]);
  const [listaVeterinarios, setListaVeterinarios] = useState([]);
  
  // Estados del Buscador y Selección
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [propietarioSeleccionado, setPropietarioSeleccionado] = useState(null);
  const [mascotasDisponibles, setMascotasDisponibles] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

  // Estado del Formulario
  const [formulario, setFormulario] = useState({
    idVeterinario: '',
    veterinario: '',
    fecha: refuerzoInicial?.proximaDosis || hoyStr,
    hora: '',
    tipoServicio: esCitaDeRefuerzo ? 'Vacunación' : 'Consulta general',
    motivo: esCitaDeRefuerzo ? `Refuerzo de ${refuerzoInicial.nombreTipoVacuna}` : '',
    notas: ''
  });

  const [errorValidacion, setErrorValidacion] = useState('');
  const [exitoMensaje, setExitoMensaje] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState({ horariosVeterinario: [], horariosMascota: [] });
  const [estadoHorarios, setEstadoHorarios] = useState('cargando');
  const [errorHorarios, setErrorHorarios] = useState('');

  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [errorCatalogos, setErrorCatalogos] = useState('');
  const guardadoEnCurso = useRef(false);
  const temporizador = useRef(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      clearTimeout(temporizador.current);
    };
  }, []);

  // Refresca horarios al cambiar veterinario, fecha o mascota.
  // La base de datos es la fuente de verdad; no usamos solo citasExistentes.
  useEffect(() => {
    if (!formulario.fecha || !formulario.idVeterinario) {
      setEstadoHorarios('error');
      setErrorHorarios('Selecciona una fecha y un veterinario.');
      return;
    }

    const controller = new AbortController();
    setEstadoHorarios('cargando');
    setErrorHorarios('');
    setDisponibilidad({ horariosVeterinario: [], horariosMascota: [] });

    citasService.getDisponibilidad(
      formulario.fecha,
      formulario.idVeterinario,
      mascotaSeleccionada?.idMascota,
      controller.signal
    )
      .then(datos => {
        if (controller.signal.aborted) return;
        setDisponibilidad({
          horariosVeterinario: (datos.horariosVeterinario || []).map(h => String(h).slice(0, 5)),
          horariosMascota: (datos.horariosMascota || []).map(h => String(h).slice(0, 5))
        });
        setEstadoHorarios('listo');
        setFormulario(prev => {
          const ocupada = [...(datos.horariosVeterinario || []), ...(datos.horariosMascota || [])]
            .some(h => String(h).slice(0, 5) === prev.hora);
          return ocupada ? { ...prev, hora: '' } : prev;
        });
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setEstadoHorarios('error');
        setErrorHorarios(err.message || 'No se pudieron consultar los horarios.');
      });

    return () => controller.abort();
  }, [formulario.fecha, formulario.idVeterinario, mascotaSeleccionada?.idMascota]);

  const horaYaPaso = (hora) => {
    if (!formulario.fecha) return true;
    return new Date(`${formulario.fecha}T${hora}:00`).getTime() <= Date.now();
  };

  // Carga los catálogos reales; no permite guardar con datos de ejemplo.
  useEffect(() => {
    let vigente = true;
    async function cargarCatalogosDesdeBD() {
      try {
        const [vetsBD, propsBD, mascBD] = await Promise.all([
          citasService.getVeterinarios(),
          citasService.getPropietarios(),
          citasService.getMascotas()
        ]);
        if (!vigente) return;
        if (![vetsBD, propsBD, mascBD].every(Array.isArray)) {
          throw new Error('No se pudieron obtener los catálogos de citas.');
        }
        if (vetsBD.length === 0) {
          throw new Error('No hay veterinarios disponibles para agendar.');
        }
        const veterinarios = vetsBD.map(v => ({
          idVeterinario: v.idVeterinario ?? v.id,
          nombre: v.nombre,
          consultorio: v.consultorio || `Consultorio ${v.idVeterinario ?? v.id}`
        }));
        const propietarios = propsBD.map(p => {
          const id = p.idPropietario ?? p.id;
          const mascotasRelacionadas = mascBD.filter(m =>
            String(m.idPropietario ?? m.propietario?.idPropietario) === String(id)
          );
          const mascotasCrudas = mascotasRelacionadas.length > 0
            ? mascotasRelacionadas
            : (Array.isArray(p.mascotas) ? p.mascotas : []);
          return {
            id,
            nombre: `${p.nombres || ''} ${p.apellidos || ''}`.trim() || p.nombre || '',
            dui: p.dui || '—',
            telefono: p.telefono || '—',
            mascotas: mascotasCrudas.map(m => ({
              idMascota: m.idMascota ?? m.id,
              nombre: m.nombre,
              especie: m.especie || 'Sin especificar',
              raza: m.raza || 'Sin especificar',
              exp: m.codigoExpediente || '—'
            }))
          };
        });
        setListaVeterinarios(veterinarios);
        setListaPropietarios(propietarios);
        setFormulario(prev => ({
          ...prev,
          idVeterinario: veterinarios[0].idVeterinario,
          veterinario: veterinarios[0].nombre,
          hora: ''
        }));
      } catch (err) {
        if (vigente) setErrorCatalogos(err.message || 'No se pudieron cargar los datos.');
      } finally {
        if (vigente) setCargandoCatalogos(false);
      }
    }
    cargarCatalogosDesdeBD();
    return () => { vigente = false; };
  }, []);

  // El refuerzo determina propietario, mascota y fecha.
  useEffect(() => {
    if (!refuerzoInicial || cargandoCatalogos || errorCatalogos) return;
    const propietario = listaPropietarios.find(p =>
      String(p.id) === String(refuerzoInicial.idPropietario)
    );
    const mascota = propietario?.mascotas.find(m =>
      String(m.idMascota) === String(refuerzoInicial.idMascota)
    );
    if (!propietario || !mascota || !refuerzoInicial.proximaDosis ||
        refuerzoInicial.idAplicacionVacuna == null) {
      setErrorValidacion('No se encontró la mascota vinculada al propietario del refuerzo. Volvé a Próximas vacunas y revisá los datos.');
      setPropietarioSeleccionado(null);
      setMascotaSeleccionada(null);
      setMascotasDisponibles([]);
      return;
    }
    setPropietarioSeleccionado(propietario);
    setTerminoBusqueda(propietario.nombre);
    setMascotasDisponibles(propietario.mascotas);
    setMascotaSeleccionada(mascota);
    setFormulario(prev => ({
      ...prev,
      fecha: refuerzoInicial.proximaDosis,
      hora: '',
      tipoServicio: 'Vacunación',
      motivo: `Refuerzo de ${refuerzoInicial.nombreTipoVacuna}`
    }));
  }, [refuerzoInicial, listaPropietarios, cargandoCatalogos, errorCatalogos]);

  // Filtro reactivo para el autocompletado del buscador
  const propietariosFiltrados = terminoBusqueda.trim() === ''
    ? []
    : listaPropietarios.filter(p =>
        p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
        (p.dui && p.dui.includes(terminoBusqueda))
      );

  const handleSeleccionarPropietario = (prop) => {
    if (esCitaDeRefuerzo) return;
    setPropietarioSeleccionado(prop);
    setTerminoBusqueda(prop.nombre);
    setMascotasDisponibles(prop.mascotas || []);
    setFormulario(prev => ({ ...prev, hora: '' }));

    if (prop.mascotas && prop.mascotas.length > 0) {
      setMascotaSeleccionada(prop.mascotas[0]);
    } else {
      setMascotaSeleccionada(null);
    }
    if (errorValidacion) setErrorValidacion('');
  };

  const handleCambioMascota = (e) => {
    if (esCitaDeRefuerzo) return;
    const idSel = parseInt(e.target.value, 10);
    const m = mascotasDisponibles.find(item => String(item.idMascota) === String(idSel));
    setMascotaSeleccionada(m);
    setFormulario(prev => ({ ...prev, hora: '' }));
  };

  const estaHoraOcupada = (horaEvaluar) =>
    disponibilidad.horariosVeterinario.includes(horaEvaluar) ||
    disponibilidad.horariosMascota.includes(horaEvaluar);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardadoEnCurso.current || exitoMensaje) return;
    setErrorValidacion('');
    if (cargandoCatalogos || errorCatalogos) {
      setErrorValidacion(errorCatalogos || 'Esperá a que se carguen los datos.');
      return;
    }
    if (esCitaDeRefuerzo && (
      refuerzoInicial.idAplicacionVacuna == null ||
      refuerzoInicial.idCitaAgendada != null ||
      String(propietarioSeleccionado?.id) !== String(refuerzoInicial.idPropietario) ||
      String(mascotaSeleccionada?.idMascota) !== String(refuerzoInicial.idMascota) ||
      formulario.fecha !== refuerzoInicial.proximaDosis
    )) {
      setErrorValidacion('Verificá que el refuerzo esté pendiente y que propietario, mascota y fecha coincidan.');
      return;
    }
    if (!listaVeterinarios.some(v => String(v.idVeterinario) === String(formulario.idVeterinario))) {
      setErrorValidacion('Seleccioná un veterinario válido.');
      return;
    }
    if (`${formulario.tipoServicio} - ${formulario.motivo.trim()}`.length > 255) {
      setErrorValidacion('El servicio y el motivo no deben superar 255 caracteres.');
      return;
    }

    if (!propietarioSeleccionado) {
      setErrorValidacion('Debes buscar y seleccionar un propietario registrado en el sistema.');
      return;
    }

    if (!mascotaSeleccionada || !mascotasDisponibles.some(m => Number(m.idMascota) === Number(mascotaSeleccionada.idMascota))) {
      setErrorValidacion('Selecciona una mascota vinculada al propietario.');
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

    if (formulario.fecha < obtenerFechaHoyLocal()) {
      setErrorValidacion('No se permiten fechas pasadas.');
      return;
    }

    if (!formulario.hora || !BLOQUES_HORARIOS.includes(formulario.hora)) {
      setErrorValidacion('Selecciona un horario válido.');
      return;
    }

    if (horaYaPaso(formulario.hora)) {
      setErrorValidacion('No puedes programar una cita en una hora pasada.');
      return;
    }

    if (estadoHorarios !== 'listo') {
      setErrorValidacion('Espera a que se consulte la disponibilidad antes de guardar.');
      return;
    }

    if (disponibilidad.horariosVeterinario.includes(formulario.hora)) {
      setErrorValidacion(`El ${formulario.veterinario} ya tiene una cita a las ${formulario.hora}.`);
      return;
    }

    if (disponibilidad.horariosMascota.includes(formulario.hora)) {
      setErrorValidacion(`La mascota ya tiene otra cita a las ${formulario.hora}.`);
      return;
    }

    // Payload exacto hacia la entidad Cita.java y base de datos
    const payloadBackend = {
      fecha: esCitaDeRefuerzo ? refuerzoInicial.proximaDosis : String(formulario.fecha).trim(),
      hora: formulario.hora.length === 5 ? `${formulario.hora}:00` : formulario.hora,
      motivo: `${formulario.tipoServicio} - ${formulario.motivo.trim()}`,
      estado: 'Programada',
      horaLlegada: null,
      idMascota: Number(esCitaDeRefuerzo ? refuerzoInicial.idMascota : mascotaSeleccionada.idMascota),
      idVeterinario: Number(formulario.idVeterinario),
      idAplicacionVacuna: esCitaDeRefuerzo ? Number(refuerzoInicial.idAplicacionVacuna) : null
    };

    try {
      guardadoEnCurso.current = true;
      setGuardando(true);
      const citaGuardada = await citasService.guardarCita(payloadBackend);
      if (!montado.current) return;

      // Objeto formateado para actualizar el estado del Dashboard visualmente de inmediato
      const nuevaCitaUI = {
        id: citaGuardada.idCita,
        idCita: citaGuardada.idCita,
        idAplicacionVacuna: citaGuardada.idAplicacionVacuna ?? payloadBackend.idAplicacionVacuna,
        hora: formulario.hora,
        fecha: formulario.fecha,
        codigoExpediente: mascotaSeleccionada.exp,
        mascota: mascotaSeleccionada.nombre,
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
      temporizador.current = setTimeout(() => {
        if (onVolver) onVolver();
      }, 1200);
    } catch (err) {
      if (!montado.current) return;
      setErrorValidacion(err.message || 'Error al conectar con el servidor.');
      // Otro usuario pudo reservar ese bloque mientras se confirmaba la cita.
      setEstadoHorarios('cargando');
      try {
        const datos = await citasService.getDisponibilidad(
          formulario.fecha,
          formulario.idVeterinario,
          mascotaSeleccionada?.idMascota
        );
        setDisponibilidad({
          horariosVeterinario: (datos.horariosVeterinario || []).map(h => String(h).slice(0, 5)),
          horariosMascota: (datos.horariosMascota || []).map(h => String(h).slice(0, 5))
        });
        setEstadoHorarios('listo');
      } catch {
        setEstadoHorarios('error');
        setErrorHorarios('No se pudieron actualizar los horarios.');
      }
    } finally {
      guardadoEnCurso.current = false;
      if (montado.current) setGuardando(false);
    }
  };

  return (
    <div className="cita-page-container">
      {/* Header */}
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link" style={{ cursor: 'pointer' }}>{esCitaDeRefuerzo ? 'Próximas vacunas' : 'Dashboard'}</span> &gt; <span>Programación de Citas</span>
          </div>
          <h1 className="cita-page-title">Agendar Nueva Cita Médica</h1>
          <p className="cita-page-sub">Asignación de paciente y programación de la cita</p>
        </div>

        <button type="button" onClick={onVolver} disabled={guardando || exitoMensaje} className="btn-volver-dash">
          <ArrowLeft size="1em" className="icono-texto" /> {esCitaDeRefuerzo ? 'Volver a próximas vacunas' : 'Volver al Dashboard'}
        </button>
      </div>

      {exitoMensaje && (
        <div className="alert-banner-success" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          <CircleCheck size="1em" className="icono-texto" /> Cita médica guardada con éxito (Fecha: {formulario.fecha}). {esCitaDeRefuerzo ? 'Regresando a próximas vacunas...' : 'Regresando al Dashboard...'}
        </div>
      )}

      {cargandoCatalogos && <p role="status">Cargando propietarios, mascotas y veterinarios...</p>}
      {errorCatalogos && <div className="alert-banner-danger" role="alert">{errorCatalogos}</div>}
      {esCitaDeRefuerzo && (
        <p style={{ color: '#0369a1', marginBottom: 16 }}>
          El propietario, la mascota y la fecha corresponden al refuerzo seleccionado y no pueden cambiarse.
        </p>
      )}
      {esCitaDeRefuerzo && formulario.fecha < hoyStr && (
        <div className="alert-banner-danger" role="alert">
          La fecha de este refuerzo ya pasó. No se puede agendar una cita en una fecha pasada.
        </div>
      )}
      {errorValidacion && (
        <div className="alert-banner-danger" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          <TriangleAlert size="1em" className="icono-texto" /> {errorValidacion}
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
                  readOnly={esCitaDeRefuerzo || guardando || exitoMensaje}
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
                {!esCitaDeRefuerzo && !guardando && !exitoMensaje && propietariosFiltrados.length > 0 && !propietarioSeleccionado && (
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
                          <PawPrint size="1em" className="icono-texto" /> {p.mascotas.length} mascota(s)
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
                  disabled={esCitaDeRefuerzo || guardando || exitoMensaje || !propietarioSeleccionado || mascotasDisponibles.length === 0}
                  value={mascotaSeleccionada ? mascotaSeleccionada.idMascota : ''}
                  onChange={handleCambioMascota}
                  style={{ fontWeight: 600 }}
                >
                  {mascotasDisponibles.length === 0 ? (
                    <option value="">Selecciona primero un propietario...</option>
                  ) : (
                    mascotasDisponibles.map(m => (
                      <option key={m.idMascota} value={m.idMascota}>
                        {m.nombre} ({m.especie} - {m.raza})
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
                  disabled={cargandoCatalogos || Boolean(errorCatalogos) || guardando || exitoMensaje}
                  value={formulario.idVeterinario}
                  onChange={(e) => {
                    const idSel = parseInt(e.target.value, 10);
                    const vSel = listaVeterinarios.find(v => String(v.idVeterinario) === String(idSel));
                    setFormulario(prev => ({
                      ...prev,
                      idVeterinario: idSel,
                      veterinario: vSel ? vSel.nombre : '',
                      hora: ''
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
                  disabled={esCitaDeRefuerzo || guardando || exitoMensaje}
                  value={formulario.fecha}
                  min={hoyStr}
                  onChange={(e) => setFormulario(prev => ({ ...prev, fecha: e.target.value, hora: '' }))}
                  required
                />
              </div>
            </div>

            {/* Selector de bloques horarios */}
            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '8px' }}>
                Selecciona la hora de atención (Bloques de 30 min):
              </label>

              {estadoHorarios === 'cargando' && (
                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Consultando horarios disponibles...</p>
              )}
              {estadoHorarios === 'error' && (
                <p role="alert" style={{ color: '#b91c1c', fontSize: '0.8rem' }}>{errorHorarios}</p>
              )}
              <div className="time-slots-grid">
                {BLOQUES_HORARIOS.map(slot => {
                  const ocupada = estaHoraOcupada(slot);
                  const elegida = formulario.hora === slot;
                  const pasada = horaYaPaso(slot);
                  const sinDisponibilidad = estadoHorarios !== 'listo';
                  const bloqueada = ocupada || pasada || sinDisponibilidad || guardando || exitoMensaje || cargandoCatalogos || !mascotaSeleccionada;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={bloqueada}
                      onClick={() => setFormulario(prev => ({ ...prev, hora: slot }))}
                      className={`time-slot-btn ${bloqueada ? 'slot-occupied' : elegida ? 'slot-selected' : 'slot-available'}`}
                    >
                      <span>{slot}</span>
                      <small>{sinDisponibilidad ? 'Consultando' : pasada ? 'Pasado' : ocupada ? 'Ocupado' : elegida ? 'Elegido' : 'Libre'}</small>
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
                  disabled={guardando || exitoMensaje}
                  value={formulario.tipoServicio}
                  onChange={(e) => setFormulario(prev => ({ ...prev, tipoServicio: e.target.value }))}
                >
                  <option value="Consulta general">Consulta general</option>
                  <option value="Vacunación">Vacunación</option>
                  <option value="Desparasitación">Desparasitación</option>
                  <option value="Control de rutina">Control de rutina</option>
                  <option value="Seguimiento / Curación">Seguimiento / Curación</option>
                  <option value="Cirugía menor">Cirugía menor</option>
                </select>
              </div>

              <div className="input-group-vet">
                <label>Motivo Breve de la Cita *</label>
                <input
                  type="text"
                  placeholder="Ej. Chequeo anual, cojera en pata delantera..."
                  value={formulario.motivo}
                  readOnly={guardando || exitoMensaje}
                  maxLength={255}
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
                  <span>{mascotaSeleccionada.nombre} ({mascotaSeleccionada.especie})</span>
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
              <div className="summary-val">{formulario.fecha} a las <strong>{formulario.hora || 'Sin seleccionar'}</strong></div>
            </div>

            <div className="summary-item">
              <span className="summary-label">Servicio</span>
              <div className="summary-val">{formulario.tipoServicio}</div>
            </div>

            <hr className="summary-divider" />

            <div className="summary-actions">
              <button type="submit" className="btn-confirm-save" disabled={guardando || exitoMensaje || cargandoCatalogos || Boolean(errorCatalogos) || estadoHorarios !== 'listo' || !formulario.hora || !propietarioSeleccionado || !mascotaSeleccionada}>
                {guardando ? 'Guardando...' : 'Confirmar y Agendar Cita'}
              </button>
              <button type="button" onClick={onVolver} className="btn-cancel-flat" disabled={guardando || exitoMensaje}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}