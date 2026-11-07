import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bird, Cat, CircleCheck, Dog, Lock, PawPrint, Rabbit, Stethoscope, Syringe, TriangleAlert } from 'lucide-react';
import { consultasService } from './consultasService';
import { vacunasService } from '../vacunas/vacunasService';

const formularioInicial = {
  motivoConsulta: '',
  anamnesis: '',
  temperatura: '',
  pesoActual: '',
  frecuenciaCardiaca: '',
  examenFisico: '',
  diagnostico: '',
  observaciones: ''
};

const iconoEspecie = (especie = '') => {
  const valor = especie.toLowerCase();
  if (valor.includes('gato') || valor.includes('felino')) return <Cat size="1em" />;
  if (valor.includes('ave') || valor.includes('pájaro')) return <Bird size="1em" />;
  if (valor.includes('conejo')) return <Rabbit size="1em" />;
  if (valor.includes('perro') || valor.includes('canino')) return <Dog size="1em" />;
  return <PawPrint size="1em" />;
};

export default function RegistrarConsultaPage({ citaInicial = null, onVolver, onAbrirVacunacion }) {
  const [citasEspera, setCitasEspera] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [citaSeleccionada, setCitaSeleccionada] = useState(citaInicial);
  const [historial, setHistorial] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null);

  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [mensajeFinalizacion, setMensajeFinalizacion] = useState('');
  const [vacunasAplicadas, setVacunasAplicadas] = useState([]);
  const [errorVacunas, setErrorVacunas] = useState('');

  useEffect(() => {
    const cargarBase = async () => {
      try {
        setCargando(true);
        setError('');

        const [citas, mascotasBD, veterinariosBD] = await Promise.all([
          consultasService.getCitasHoy(),
          consultasService.getMascotas(),
          consultasService.getVeterinarios()
        ]);

        const enEspera = (citas || []).filter(
          (c) =>
            c.estado === 'En Sala de Espera' ||
            c.estado === 'En espera' ||
            c.estado === 'En Consulta'
        );

        setCitasEspera(enEspera);
        setMascotas(mascotasBD || []);
        setVeterinarios(veterinariosBD || []);

        if (citaInicial?.idCita || citaInicial?.id) {
          const id = citaInicial.idCita || citaInicial.id;
          const real = enEspera.find((c) => c.idCita === id);
          if (real) setCitaSeleccionada(real);
        }
      } catch (err) {
        setError(err.message || 'No se pudo cargar la información clínica.');
      } finally {
        setCargando(false);
      }
    };

    cargarBase();
  }, [citaInicial]);


  useEffect(() => {
    let activo = true;

    setHistorial([]);

    if (!citaSeleccionada?.idMascota) {
      setCargandoHistorial(false);
      return () => { activo = false; };
    }

    setFormulario((prev) => ({
      ...prev,
      motivoConsulta: prev.motivoConsulta || citaSeleccionada.motivo || ''
    }));

    setCargandoHistorial(true);

    consultasService.getHistorialMascota(citaSeleccionada.idMascota)
     
        .then((datos) => {
          if (!activo) return;

          const registros = Array.isArray(datos) ? datos : [];
          setHistorial(registros);

          const consultaActual = registros.find(
            (consulta) =>
              String(consulta.idCita) === String(citaSeleccionada.idCita)
          );

          if (consultaActual) {
            setFormulario({
              motivoConsulta: consultaActual.motivoConsulta || '',
              anamnesis: consultaActual.anamnesis || '',
              temperatura: consultaActual.temperatura ?? '',
              pesoActual: consultaActual.pesoActual ?? '',
              frecuenciaCardiaca: consultaActual.frecuenciaCardiaca ?? '',
              examenFisico: consultaActual.examenFisico || '',
              diagnostico: consultaActual.diagnostico || '',
              observaciones: consultaActual.observaciones || ''
            });
          }
        })

      .catch(() => {
        if (activo) {
          setHistorial([]);
          setError('No se pudo consultar el historial médico.');
        }
      })
      .finally(() => {
        if (activo) setCargandoHistorial(false);
      });

    return () => { activo = false; };
  }, [citaSeleccionada]);


  // Cartilla de vacunación real, vinculada a la mascota seleccionada.
  useEffect(() => {
    let activo = true;
    setVacunasAplicadas([]);
    setErrorVacunas('');
    if (!citaSeleccionada?.idMascota) return () => { activo = false; };

    vacunasService.listarVacunas(citaSeleccionada.idMascota)
      .then((registros) => { if (activo) setVacunasAplicadas(registros || []); })
      .catch(() => { if (activo) setErrorVacunas('No se pudo cargar la cartilla de vacunas.'); });

    return () => { activo = false; };
  }, [citaSeleccionada?.idMascota]);

  const mascota = useMemo(
    () => mascotas.find((m) => m.idMascota === citaSeleccionada?.idMascota),
    [mascotas, citaSeleccionada]
  );

  const veterinario = useMemo(
    () => veterinarios.find((v) => v.idVeterinario === citaSeleccionada?.idVeterinario),
    [veterinarios, citaSeleccionada]
  );
  
  // Detectar si la cita ya tiene una consulta médica registrada
  const consultaRegistrada =
    historial.find(
      (consulta) =>
        String(consulta.idCita) === String(citaSeleccionada?.idCita)
    ) ||
    (
      exito &&
      String(exito.idCita) === String(citaSeleccionada?.idCita)
        ? exito
        : null
    );


  const handleSeleccionarCita = (cita) => {
    setCitaSeleccionada(cita);
    setFormulario({ ...formularioInicial, motivoConsulta: cita.motivo || '' });
    setExito(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito(null);

    if (!citaSeleccionada) {
      setError('Selecciona primero un paciente que se encuentre en sala de espera.');
      return;
    }

    if (!formulario.motivoConsulta.trim() || !formulario.diagnostico.trim() || !formulario.observaciones.trim()) {
      setError('Motivo de consulta, diagnóstico y observaciones son campos obligatorios.');
      return;
    }

    const payload = {
      idCita: citaSeleccionada.idCita,
      idMascota: citaSeleccionada.idMascota,
      idVeterinario: citaSeleccionada.idVeterinario,
      motivoConsulta: formulario.motivoConsulta.trim(),
      anamnesis: formulario.anamnesis.trim() || null,
      temperatura: formulario.temperatura === '' ? null : Number(formulario.temperatura),
      pesoActual: formulario.pesoActual === '' ? null : Number(formulario.pesoActual),
      frecuenciaCardiaca: formulario.frecuenciaCardiaca === '' ? null : Number(formulario.frecuenciaCardiaca),
      examenFisico: formulario.examenFisico.trim() || null,
      diagnostico: formulario.diagnostico.trim(),
      observaciones: formulario.observaciones.trim()
    };

    try {
      setGuardando(true);
      const guardada = await consultasService.registrarConsulta(payload);
      setExito(guardada);

      const nuevoHistorial = await consultasService.getHistorialMascota(citaSeleccionada.idMascota);
      setHistorial(nuevoHistorial);
    } catch (err) {
      setError(err.message || 'No fue posible registrar la consulta.');
    } finally {
      setGuardando(false);
    }
  };

  
  // Finalizar consulta médica y marcar cita como Atendida
  const handleFinalizarConsulta = async () => {
    if (!consultaRegistrada?.idConsulta || !citaSeleccionada) {
      setError('Primero debe existir una consulta médica registrada.');
      return;
    }

    const confirmar = window.confirm(
      `¿Deseás finalizar la consulta de ${
        mascota?.nombre || 'este paciente'
      }? La cita pasará a Atendida.`
    );

    if (!confirmar) return;

    try {
      setGuardando(true);
      setError('');

      await consultasService.finalizarConsulta(
        consultaRegistrada.idConsulta
      );

      // Retirar la cita de la lista de pacientes activos
      setCitasEspera((prev) =>
        prev.filter((c) => c.idCita !== citaSeleccionada.idCita)
      );

      setMensajeFinalizacion(
        `La consulta de ${mascota?.nombre || 'la mascota'} fue finalizada. ` +
        'La cita ahora está Atendida.'
      );

      setCitaSeleccionada(null);
      setHistorial([]);
      setFormulario(formularioInicial);
      setExito(null);

    } catch (err) {
      setError(err.message || 'No se pudo finalizar la consulta.');
    } finally {
      setGuardando(false);
    }
  };


  const fechaHoraLegible = (valor) => {
    if (!valor) return '—';
    return new Date(valor).toLocaleString('es-SV', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="cita-page-container consulta-page-container">
      <style>{`
        .consulta-datos-bloqueados .input-group-vet input,
        .consulta-datos-bloqueados .input-group-vet textarea,
        .consulta-datos-bloqueados .input-group-vet select {
          background: #e9edf2 !important;
          border: 1px solid #cbd5e1 !important;
          color: #475569 !important;
          opacity: 1 !important;
          -webkit-text-fill-color: #475569 !important;
          cursor: not-allowed !important;
        }
        .consulta-datos-bloqueados .input-group-vet label { color: #64748b; }
      `}</style>
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link">Dashboard</span> &gt; <span>Área Clínica</span> &gt; <span>Consultas Médicas</span>
          </div>
          <h1 className="cita-page-title">Registro de Consulta Médica</h1>
          <p className="cita-page-sub">Motivo, evaluación clínica, diagnóstico y observaciones</p>
        </div>
        <button type="button" onClick={onVolver} className="btn-volver-dash"><ArrowLeft size="1em" className="icono-texto" /> Volver al Dashboard</button>
      </div>

      {error && <div className="alert-banner-danger"><TriangleAlert size="1em" className="icono-texto" /> {error}</div>}
      {mensajeFinalizacion && (
      <div className="alert-banner-success">
        <CircleCheck size="1em" className="icono-texto" /> {mensajeFinalizacion}
      </div>
)}

      {exito && (
        <div className="alert-banner-success">
          <CircleCheck size="1em" className="icono-texto" /> <strong>Consulta registrada correctamente.</strong>{' '}
          ID #{exito.idConsulta} · {fechaHoraLegible(exito.fechaHora)} · vinculada al expediente de {mascota?.nombre || 'la mascota'}.
        </div>
      )}

      <div className="consulta-workspace">
        <aside className="consulta-waiting-panel">
          <div className="consulta-panel-heading">
            <div>
              <strong>Pacientes en atención</strong>
              <span>{citasEspera.length} paciente(s)</span>
            </div>
          </div>

          {cargando ? (
            <div className="consulta-empty-state">Cargando pacientes...</div>
          ) : citasEspera.length === 0 ? (
            <div className="consulta-empty-state">
              No hay pacientes en espera ni en consulta.
            </div>
          ) : (
            <div className="consulta-patient-list">
              {citasEspera.map((cita) => {
                const pet = mascotas.find((m) => m.idMascota === cita.idMascota);
                const vet = veterinarios.find((v) => v.idVeterinario === cita.idVeterinario);
                const activa = citaSeleccionada?.idCita === cita.idCita;

                return (
                  <button
                    type="button"
                    key={cita.idCita}
                    className={`consulta-patient-card ${activa ? 'active' : ''}`}
                    onClick={() => handleSeleccionarCita(cita)}
                  >
                    <span className="consulta-pet-icon">{iconoEspecie(pet?.especie)}</span>
                    <span className="consulta-patient-data">
                      <strong>{pet?.nombre || `Mascota #${cita.idMascota}`}</strong>
                      {cita.estado === 'En Consulta' && (
                        <small style={{ color: '#0284c7', fontWeight: '700' }}>
                          <Stethoscope size="1em" className="icono-texto" /> En consulta
                        </small>
                      )}
                      <small>{pet?.codigoExpediente || 'Expediente pendiente'} · {cita.hora?.slice?.(0, 5) || cita.hora}</small>
                      <small>{vet?.nombre || `Veterinario #${cita.idVeterinario}`}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="consulta-main-column">
          {!citaSeleccionada ? (
            <div className="cita-card-section consulta-select-prompt">
              <div className="consulta-prompt-icon"><Stethoscope size="1em" /></div>
              <h3>Selecciona un paciente</h3>
              <p>
                Selecciona un paciente en espera o en consulta para continuar
                con su registro clínico.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="consulta-form-stack">              
            <fieldset
              className={consultaRegistrada ? "consulta-datos-bloqueados" : ""}
              disabled={Boolean(consultaRegistrada) || cargandoHistorial}
              style={{
                border: 'none',
                padding: 0,
                margin: 0,
                minWidth: 0
              }}
            >

              <div className="cita-card-section">
                <div className="consulta-patient-header">
                  <div className="consulta-patient-title">
                    <span className="consulta-pet-avatar">{iconoEspecie(mascota?.especie)}</span>
                    <div>
                      <h3>{mascota?.nombre || `Mascota #${citaSeleccionada.idMascota}`}</h3>
                      <p>{mascota?.especie || 'Especie'} · {mascota?.raza || 'Raza no especificada'} · {mascota?.sexo || 'Sexo no especificado'}</p>
                    </div>
                  </div>
                  <div className="consulta-exp-badge">{mascota?.codigoExpediente || 'Sin código'}</div>
                </div>

                <div className="consulta-info-strip">
                  <div><span>Médico</span><strong>{veterinario?.nombre || `Veterinario #${citaSeleccionada.idVeterinario}`}</strong></div>
                  <div><span>Cita</span><strong>{citaSeleccionada.hora?.slice?.(0, 5) || citaSeleccionada.hora} · {citaSeleccionada.estado}</strong></div>
                  <div><span>Motivo agendado</span><strong>{citaSeleccionada.motivo}</strong></div>
                </div>
              </div>

              <div className="cita-card-section">
                <h3 className="section-title-aqua">1. Motivo y Anamnesis</h3>
                <div className="input-group-vet">
                  <label>Motivo de consulta *</label>
                  <textarea name="motivoConsulta" rows="3" value={formulario.motivoConsulta} onChange={handleChange} placeholder="Describa el motivo principal de atención..." />
                </div>
                <div className="input-group-vet" style={{ marginTop: '14px' }}>
                  <label>Anamnesis</label>
                  <textarea name="anamnesis" rows="4" value={formulario.anamnesis} onChange={handleChange} placeholder="Antecedentes relevantes, evolución, alimentación, síntomas referidos..." />
                </div>
              </div>

              <div className="cita-card-section">
                <h3 className="section-title-aqua">2. Signos Vitales y Examen Físico</h3>
                <div className="fields-grid-2 consulta-vitals-grid">
                  <div className="input-group-vet">
                    <label>Temperatura (°C)</label>
                    <input type="number" step="0.1" min="30" max="45" name="temperatura" value={formulario.temperatura} onChange={handleChange} placeholder="Ej. 38.5" />
                  </div>
                  <div className="input-group-vet">
                    <label>Peso actual (kg)</label>
                    <input type="number" step="0.01" min="0.01" name="pesoActual" value={formulario.pesoActual} onChange={handleChange} placeholder="Ej. 12.40" />
                  </div>
                  <div className="input-group-vet">
                    <label>Frecuencia cardíaca (lpm)</label>
                    <input type="number" min="1" name="frecuenciaCardiaca" value={formulario.frecuenciaCardiaca} onChange={handleChange} placeholder="Ej. 95" />
                  </div>
                  <div className="input-group-vet">
                    <label>Fecha / hora de atención</label>
                    <input className="input-disabled-clean" value="Se asignará automáticamente al guardar" disabled readOnly />
                  </div>
                </div>
                <div className="input-group-vet" style={{ marginTop: '14px' }}>
                  <label>Examen físico</label>
                  <textarea name="examenFisico" rows="4" value={formulario.examenFisico} onChange={handleChange} placeholder="Hallazgos del examen físico general..." />
                </div>
              </div>

              <div className="cita-card-section">
                <h3 className="section-title-aqua">3. Diagnóstico y Observaciones</h3>
                
                <div className="input-group-vet">
                  <label>Diagnóstico médico *</label>
                  <textarea name="diagnostico" rows="4" value={formulario.diagnostico} onChange={handleChange} placeholder="Registre el diagnóstico preliminar o definitivo..." />
                </div>
                <div className="input-group-vet" style={{ marginTop: '14px' }}>
                  <label>Observaciones adicionales *</label>
                  <textarea name="observaciones" rows="4" value={formulario.observaciones} onChange={handleChange} placeholder="Indicaciones clínicas, hallazgos o notas relevantes..." />
                </div>
              </div>
              </fieldset>
              
              {/* Cartilla disponible después de registrar la consulta */}
              <div
                className="cita-card-section"
                style={!consultaRegistrada ? {
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1'
                } : undefined}
              >
                <h3
                  className="section-title-aqua"
                  style={!consultaRegistrada ? { color: '#64748b' } : undefined}
                >
                  4. Aplicación de vacunas
                </h3>

                {!consultaRegistrada && (
                  <div
                    role="status"
                    style={{
                      padding: '14px 16px',
                      background: '#e2e8f0',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      color: '#475569',
                      fontSize: 13,
                      marginBottom: 16
                    }}
                  >
                    Primero completá los campos obligatorios y registrá la consulta médica.
                    Después podrás abrir la cartilla y registrar nuevas vacunas.
                  </div>
                )}

                <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                  Vacunas registradas de {mascota?.nombre || 'la mascota'}.
                  Podés consultar el historial de vacunación en cualquier momento.
                </p>

                {errorVacunas && (
                  <div className="alert-banner-danger"><TriangleAlert size="1em" className="icono-texto" /> {errorVacunas}</div>
                )}

                {vacunasAplicadas.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#64748b' }}>
                    No hay vacunas registradas para esta mascota.
                  </p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="clean-table">
                      <thead>
                        <tr>
                          <th>Fecha de aplicación</th>
                          <th>Vacuna</th>
                          <th>Lote</th>
                          <th>Veterinario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vacunasAplicadas.map((vacuna) => (
                          <tr key={vacuna.idAplicacionVacuna}>
                            <td>
                              {vacuna.fechaAplicacion
                                ? vacuna.fechaAplicacion.split('-').reverse().join('/')
                                : '—'}
                            </td>
                            <td>{vacuna.nombreTipoVacuna}</td>
                            <td>{vacuna.lote}</td>
                            <td>{vacuna.veterinario?.nombre || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button
                    type="button"
                    className="btn-confirm-save"
                    disabled={
                      !citaSeleccionada?.idMascota ||
                      !onAbrirVacunacion ||
                      !consultaRegistrada ||
                      cargandoHistorial
                    }
                    onClick={() => onAbrirVacunacion(citaSeleccionada.idMascota)}
                    style={!consultaRegistrada ? {
                      background: '#cbd5e1',
                      color: '#64748b',
                      borderColor: '#cbd5e1',
                      cursor: 'not-allowed',
                      boxShadow: 'none',
                      opacity: 1
                    } : undefined}
                  >
                    {consultaRegistrada ? <Syringe size="1em" className="icono-texto" /> : <Lock size="1em" className="icono-texto" />} Abrir cartilla / Registrar vacuna
                  </button>
                </div>

                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
                  La fecha de aplicación y el veterinario se registran en Vacunación.
                </p>
              </div>

              <div className="consulta-actions-bar">
                <div>
                  <strong>Registro clínico</strong>
                  <span>
                    {cargandoHistorial
                      ? 'Verificando consulta registrada...'
                      : consultaRegistrada
                        ? 'Consulta registrada. Pendiente de finalizar atención.'
                        : 'Se guardará la consulta médica.'}
                  </span>
                </div>

                <div className="consulta-actions-buttons">
                  <button
                    type="button"
                    className="btn-cancel-flat"
                    onClick={onVolver}
                  >
                    Volver
                  </button>

                  {cargandoHistorial ? (
                    <button
                      type="button"
                      className="btn-confirm-save"
                      disabled
                    >
                      Verificando...
                    </button>
                  ) : consultaRegistrada ? (
                    <button
                      type="button"
                      className="btn-confirm-save"
                      onClick={handleFinalizarConsulta}
                      disabled={guardando}
                    >
                      {guardando
                        ? 'Finalizando...'
                        : 'Finalizar consulta'}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn-confirm-save"
                      disabled={
                        guardando ||
                        citaSeleccionada?.estado !== 'En Consulta'
                      }
                    >
                      {guardando
                        ? 'Guardando...'
                        : 'Registrar Consulta Médica'}
                    </button>
                  )}
                </div>
              </div>

            </form>
          )}
        </div>

        <aside className="consulta-history-panel">
          <div className="consulta-panel-heading">
            <div>
              <strong>Historial previo</strong>
              <span>{mascota ? mascota.nombre : 'Sin paciente'}</span>
            </div>
          </div>

          {!citaSeleccionada ? (
            <div className="consulta-empty-state">Selecciona un paciente para consultar sus antecedentes.</div>
          ) : historial.length === 0 ? (
            <div className="consulta-empty-state">Este paciente aún no posee consultas médicas registradas.</div>
          ) : (
            <div className="consulta-history-list">
              {historial.slice(0, 5).map((item) => (
                <div key={item.idConsulta} className="consulta-history-item">
                  <span>{fechaHoraLegible(item.fechaHora)}</span>
                  <strong>{item.diagnostico}</strong>
                  <p>{item.motivoConsulta}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
