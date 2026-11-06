import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  LockKeyhole,
  Pencil,
  Pill,
  Plus,
  Save,
  Trash2,
  X
} from 'lucide-react';
import { tratamientosService } from './tratamientosService';

const formularioInicial = {
  medicamento: '',
  dosis: '',
  frecuencia: '',
  duracion: '',
  indicaciones: ''
};

export default function TratamientoForm({ consulta }) {
  const [tratamientos, setTratamientos] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [tratamientoEditando, setTratamientoEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const idConsulta = consulta?.idConsulta;
  const bloqueado = !idConsulta || Boolean(consulta?.finalizada);

  useEffect(() => {
    let activo = true;

    setTratamientos([]);
    setFormulario(formularioInicial);
    setTratamientoEditando(null);
    setError('');
    setMensaje('');

    if (!idConsulta) return () => { activo = false; };

    setCargando(true);
    tratamientosService.listarPorConsulta(idConsulta)
      .then((datos) => {
        if (activo) setTratamientos(Array.isArray(datos) ? datos : []);
      })
      .catch((err) => {
        if (activo) setError(err.message || 'No se pudieron cargar los tratamientos.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, [idConsulta]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (mensaje) setMensaje('');
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setTratamientoEditando(null);
  };

  const recargarTratamientos = async () => {
    const datos = await tratamientosService.listarPorConsulta(idConsulta);
    setTratamientos(Array.isArray(datos) ? datos : []);
  };

  const handleSubmit = async () => {
    setError('');
    setMensaje('');

    if (bloqueado) {
      setError('Primero debe existir una consulta médica activa.');
      return;
    }

    if (
      !formulario.medicamento.trim() ||
      !formulario.dosis.trim() ||
      !formulario.frecuencia.trim() ||
      !formulario.duracion.trim()
    ) {
      setError('Medicamento, dosis, frecuencia y duración son obligatorios.');
      return;
    }

    const payload = {
      idConsulta,
      medicamento: formulario.medicamento.trim(),
      dosis: formulario.dosis.trim(),
      frecuencia: formulario.frecuencia.trim(),
      duracion: formulario.duracion.trim(),
      indicaciones: formulario.indicaciones.trim() || null
    };

    try {
      setGuardando(true);

      if (tratamientoEditando) {
        await tratamientosService.actualizar(tratamientoEditando, payload);
        setMensaje('Tratamiento actualizado correctamente.');
      } else {
        await tratamientosService.registrar(payload);
        setMensaje('Tratamiento agregado a la consulta.');
      }

      limpiarFormulario();
      await recargarTratamientos();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el tratamiento.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (tratamiento) => {
    setTratamientoEditando(tratamiento.idTratamiento);
    setFormulario({
      medicamento: tratamiento.medicamento || '',
      dosis: tratamiento.dosis || '',
      frecuencia: tratamiento.frecuencia || '',
      duracion: tratamiento.duracion || '',
      indicaciones: tratamiento.indicaciones || ''
    });
    setError('');
    setMensaje('');
  };

  const handleEliminar = async (tratamiento) => {
    const confirmar = window.confirm(
      `¿Deseás eliminar ${tratamiento.medicamento} de la prescripción?`
    );

    if (!confirmar) return;

    try {
      setGuardando(true);
      setError('');
      setMensaje('');
      await tratamientosService.eliminar(tratamiento.idTratamiento);
      if (tratamientoEditando === tratamiento.idTratamiento) limpiarFormulario();
      await recargarTratamientos();
      setMensaje('Tratamiento eliminado de la consulta.');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el tratamiento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={`cita-card-section tratamiento-section ${bloqueado ? 'tratamiento-section-locked' : ''}`}>
      <div className="tratamiento-heading">
        <div>
          <h3 className="section-title-aqua"><Pill size={18} /> 4. Tratamiento y prescripción médica</h3>
          <p>Registre uno o varios medicamentos vinculados a esta consulta.</p>
        </div>
        <span className="panel-tag-aqua">CON-02</span>
      </div>

      {!idConsulta ? (
        <div className="tratamiento-lock-message">
          <LockKeyhole size={17} />
          Primero registre la consulta médica para habilitar la prescripción.
        </div>
      ) : consulta?.finalizada ? (
        <div className="tratamiento-lock-message">
          <LockKeyhole size={17} />
          La consulta está finalizada y su tratamiento permanece en modo de solo lectura.
        </div>
      ) : (
        <div className="tratamiento-form">
          {error && <div className="alert-banner-danger"><AlertTriangle size={18} /> {error}</div>}
          {mensaje && <div className="alert-banner-success"><CheckCircle2 size={18} /> {mensaje}</div>}

          <div className="tratamiento-form-grid">
            <div className="input-group-vet">
              <label>Medicamento *</label>
              <input
                name="medicamento"
                value={formulario.medicamento}
                onChange={handleChange}
                placeholder="Ej. Amoxicilina"
                maxLength={150}
              />
            </div>
            <div className="input-group-vet">
              <label>Dosis *</label>
              <input
                name="dosis"
                value={formulario.dosis}
                onChange={handleChange}
                placeholder="Ej. 250 mg"
                maxLength={100}
              />
            </div>
            <div className="input-group-vet">
              <label>Frecuencia *</label>
              <input
                name="frecuencia"
                value={formulario.frecuencia}
                onChange={handleChange}
                placeholder="Ej. Cada 12 horas"
                maxLength={100}
              />
            </div>
            <div className="input-group-vet">
              <label>Duración *</label>
              <input
                name="duracion"
                value={formulario.duracion}
                onChange={handleChange}
                placeholder="Ej. 7 días"
                maxLength={100}
              />
            </div>
            <div className="input-group-vet tratamiento-indicaciones">
              <label>Indicaciones adicionales</label>
              <textarea
                name="indicaciones"
                rows="3"
                value={formulario.indicaciones}
                onChange={handleChange}
                placeholder="Ej. Administrar después de alimento..."
              />
            </div>
          </div>

          <div className="tratamiento-form-actions">
            {tratamientoEditando && (
              <button type="button" className="btn-cancel-flat" onClick={limpiarFormulario} disabled={guardando}>
                <X size={16} /> Cancelar edición
              </button>
            )}
            <button type="button" className="btn-confirm-save" disabled={guardando} onClick={handleSubmit}>
              {guardando ? (
                'Guardando...'
              ) : tratamientoEditando ? (
                <><Save size={16} /> Guardar cambios</>
              ) : (
                <><Plus size={16} /> Agregar tratamiento</>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="tratamiento-listado">
        <div className="tratamiento-listado-heading">
          <strong>Prescripción actual</strong>
          <span>{tratamientos.length} medicamento(s)</span>
        </div>

        {cargando ? (
          <div className="consulta-empty-state">Cargando tratamientos...</div>
        ) : tratamientos.length === 0 ? (
          <div className="consulta-empty-state">No hay tratamientos registrados en esta consulta.</div>
        ) : (
          <div className="tratamiento-cards">
            {tratamientos.map((tratamiento) => (
              <article key={tratamiento.idTratamiento} className="tratamiento-card">
                <div className="tratamiento-card-icon"><Pill size={19} /></div>
                <div className="tratamiento-card-content">
                  <strong>{tratamiento.medicamento}</strong>
                  <div className="tratamiento-card-meta">
                    <span><b>Dosis:</b> {tratamiento.dosis}</span>
                    <span><b>Frecuencia:</b> {tratamiento.frecuencia}</span>
                    <span><b>Duración:</b> {tratamiento.duracion}</span>
                  </div>
                  {tratamiento.indicaciones && <p>{tratamiento.indicaciones}</p>}
                </div>
                {!bloqueado && (
                  <div className="tratamiento-card-actions">
                    <button type="button" title="Editar tratamiento" onClick={() => handleEditar(tratamiento)} disabled={guardando}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" title="Eliminar tratamiento" onClick={() => handleEliminar(tratamiento)} disabled={guardando}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
