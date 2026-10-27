import React, { useEffect, useMemo, useState } from 'react';
import { consultasService } from './consultasService';

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
  if (valor.includes('gato') || valor.includes('felino')) return '🐱';
  if (valor.includes('ave') || valor.includes('pájaro')) return '🦜';
  if (valor.includes('conejo')) return '🐰';
  return '🐶';
};

export default function RegistrarConsultaPage({ citaInicial = null, onVolver }) {
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
          (c) => c.estado === 'En Sala de Espera' || c.estado === 'En espera'
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
    if (!citaSeleccionada?.idMascota) {
      setHistorial([]);
      return;
    }

    setFormulario((prev) => ({
      ...prev,
      motivoConsulta: prev.motivoConsulta || citaSeleccionada.motivo || ''
    }));

    consultasService.getHistorialMascota(citaSeleccionada.idMascota)
      .then(setHistorial)
      .catch(() => setHistorial([]));
  }, [citaSeleccionada]);

  const mascota = useMemo(
    () => mascotas.find((m) => m.idMascota === citaSeleccionada?.idMascota),
    [mascotas, citaSeleccionada]
  );

  const veterinario = useMemo(
    () => veterinarios.find((v) => v.idVeterinario === citaSeleccionada?.idVeterinario),
    [veterinarios, citaSeleccionada]
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

  const fechaHoraLegible = (valor) => {
    if (!valor) return '—';
    return new Date(valor).toLocaleString('es-SV', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="cita-page-container consulta-page-container">
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link">Dashboard</span> &gt; <span>Área Clínica</span> &gt; <span>Consultas Médicas</span>
          </div>
          <h1 className="cita-page-title">Registro de Consulta Médica</h1>
          <p className="cita-page-sub">Historia GCV-8 [CON-01] · Motivo, evaluación clínica, diagnóstico y observaciones</p>
        </div>
        <button type="button" onClick={onVolver} className="btn-volver-dash">← Volver al Dashboard</button>
      </div>

      {error && <div className="alert-banner-danger">⚠️ {error}</div>}

      {exito && (
        <div className="alert-banner-success">
          <strong>✓ Consulta registrada correctamente.</strong>{' '}
          ID #{exito.idConsulta} · {fechaHoraLegible(exito.fechaHora)} · vinculada al expediente de {mascota?.nombre || 'la mascota'}.
        </div>
      )}

      <div className="consulta-workspace">
        <aside className="consulta-waiting-panel">
          <div className="consulta-panel-heading">
            <div>
              <strong>Pacientes en espera</strong>
              <span>{citasEspera.length} paciente(s)</span>
            </div>
            <span className="panel-tag-aqua">CON-01</span>
          </div>

          {cargando ? (
            <div className="consulta-empty-state">Cargando pacientes desde PostgreSQL...</div>
          ) : citasEspera.length === 0 ? (
            <div className="consulta-empty-state">No hay pacientes en sala de espera.</div>
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
              <div className="consulta-prompt-icon">🩺</div>
              <h3>Selecciona un paciente</h3>
              <p>Elige una cita en estado “En Sala de Espera” para iniciar el registro clínico.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="consulta-form-stack">
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

              <div className="consulta-actions-bar">
                <div>
                  <strong>Registro clínico CON-01</strong>
                  <span>Se guardará como consulta activa, vinculada a la cita y al paciente.</span>
                </div>
                <div className="consulta-actions-buttons">
                  <button type="button" className="btn-cancel-flat" onClick={onVolver}>Cancelar</button>
                  <button type="submit" className="btn-confirm-save" disabled={guardando || !!exito}>
                    {guardando ? 'Guardando en PostgreSQL...' : exito ? '✓ Consulta registrada' : '✓ Registrar Consulta Médica'}
                  </button>
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
            <span>📋</span>
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
