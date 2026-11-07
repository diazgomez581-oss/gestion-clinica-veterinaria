import React, { useState, useEffect } from 'react';
import { CircleCheck, TriangleAlert } from 'lucide-react';
import { formatearFecha, vacunasService } from './vacunasService';
import { citasService } from '../citas/citasService';

// Fecha local en formato YYYY-MM-DD (toISOString usaría UTC y podría adelantar un día)
const hoy = () => new Date().toLocaleDateString('en-CA');

// Día siguiente a una fecha YYYY-MM-DD, también en hora local
const diaSiguiente = (fecha) => {
  const siguiente = new Date(`${fecha}T00:00:00`);
  siguiente.setDate(siguiente.getDate() + 1);
  return siguiente.toLocaleDateString('en-CA');
};

export default function CartillaVacunas({ idMascota }) {
  const [vacunas, setVacunas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [formulario, setFormulario] = useState({
    nombreTipoVacuna: '',
    lote: '',
    idVeterinario: '',
    fechaAplicacion: hoy(),
    proximaDosis: ''
  });
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    citasService.getVeterinarios().then(vets => setVeterinarios(vets || []));
  }, []);

  const cargarCartilla = async () => {
    try {
      setVacunas(await vacunasService.listarVacunas(idMascota));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargarCartilla();
  }, [idMascota]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    try {
      setGuardando(true);
      const guardada = await vacunasService.registrarVacuna(idMascota, {
        nombreTipoVacuna: formulario.nombreTipoVacuna.trim(),
        lote: formulario.lote.trim(),
        fechaAplicacion: formulario.fechaAplicacion,
        proximaDosis: formulario.proximaDosis || null,
        veterinario: { idVeterinario: Number(formulario.idVeterinario) }
      });

      setExito(`Vacuna "${guardada.nombreTipoVacuna}" registrada en la cartilla.`);
      // Se conservan veterinario y fecha para registrar varias vacunas de la misma visita
      setFormulario(prev => ({ ...prev, nombreTipoVacuna: '', lote: '', proximaDosis: '' }));
      await cargarCartilla();
    } catch (err) {
      setError(err.message || 'Error al registrar la vacuna en el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      {/* Banner de Éxito */}
      {exito && (
        <div className="alert-banner-success" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          <CircleCheck size="1em" className="icono-texto" /> {exito}
        </div>
      )}

      {/* Banner de Error */}
      {error && (
        <div className="alert-banner-danger" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          <TriangleAlert size="1em" className="icono-texto" /> {error}
        </div>
      )}

      {/* Tarjeta 1: Registro de vacuna aplicada */}
      <form onSubmit={handleSubmit} className="cita-card-section">
        <h3 className="section-title-aqua">Registrar Vacuna Aplicada</h3>

        <div className="fields-grid-2">
          <div className="input-group-vet">
            <label>Nombre o Tipo de Vacuna *</label>
            <input
              type="text"
              name="nombreTipoVacuna"
              placeholder="Ej. Rabia (Defensor 3)"
              maxLength="100"
              value={formulario.nombreTipoVacuna}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group-vet">
            <label>Lote *</label>
            <input
              type="text"
              name="lote"
              placeholder="Ej. LOTE-RB2026-88"
              maxLength="50"
              value={formulario.lote}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group-vet">
            <label>Veterinario que Aplica *</label>
            <select name="idVeterinario" value={formulario.idVeterinario} onChange={handleChange} required>
              <option value="">-- Seleccione un veterinario --</option>
              {veterinarios.map(vet => (
                <option key={vet.idVeterinario} value={vet.idVeterinario}>{vet.nombre}</option>
              ))}
            </select>
          </div>

          <div className="input-group-vet">
            <label>Fecha de Aplicación *</label>
            <input
              type="date"
              name="fechaAplicacion"
              max={hoy()}
              value={formulario.fechaAplicacion}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group-vet">
            <label>Próxima dosis</label>
            <input
              type="date"
              name="proximaDosis"
              min={formulario.fechaAplicacion ? diaSiguiente(formulario.fechaAplicacion) : undefined}
              value={formulario.proximaDosis}
              onChange={handleChange}
            />
            <small style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
              Opcional. Déjala vacía si la vacuna no lleva refuerzo.
            </small>
          </div>
        </div>

        <button type="submit" className="btn-confirm-save" disabled={guardando} style={{ marginTop: '16px' }}>
          {guardando ? 'Guardando...' : 'Registrar Vacuna'}
        </button>
      </form>

      {/* Tarjeta 2: Cartilla de vacunación (solo lectura) */}
      <div className="cita-card-section">
        <h3 className="section-title-aqua">Cartilla de Vacunación</h3>

        <table className="clean-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vacuna</th>
              <th>Lote</th>
              <th>Veterinario</th>
              <th>Próxima dosis</th>
            </tr>
          </thead>
          <tbody>
            {vacunas.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>
                  Esta mascota aún no tiene vacunas registradas.
                </td>
              </tr>
            ) : (
              vacunas.map(vacuna => (
                <tr key={vacuna.idAplicacionVacuna}>
                  <td><span className="pill-hour-aqua">{formatearFecha(vacuna.fechaAplicacion)}</span></td>
                  <td className="motive-cell-text">{vacuna.nombreTipoVacuna}</td>
                  <td>{vacuna.lote}</td>
                  <td><span className="vet-cell-pill">{vacuna.veterinario.nombre}</span></td>
                  <td>{vacuna.proximaDosis ? formatearFecha(vacuna.proximaDosis) : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
