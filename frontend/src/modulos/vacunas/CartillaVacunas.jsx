import React, { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { formatearFecha, vacunasService } from './vacunasService';

// La fecha visible usa El Salvador. La fecha definitiva la fija Spring Boot.
const fechaElSalvador = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/El_Salvador',
  year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date());

const diaSiguiente = (fecha) => {
  const siguiente = new Date(`${fecha}T12:00:00Z`);
  siguiente.setUTCDate(siguiente.getUTCDate() + 1);
  return siguiente.toISOString().slice(0, 10);
};

export default function CartillaVacunas({
  idMascota,
  citaActiva = null,
  usuarioActual = null,
  onVacunaRegistrada
}) {
  const [vacunas, setVacunas] = useState([]);
  const [formulario, setFormulario] = useState({
    nombreTipoVacuna: '',
    lote: '',
    proximaDosis: ''
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const fechaActual = fechaElSalvador();
  const esVeterinario = usuarioActual?.rol === 'VETERINARIO';
  const veterinarioCoincide =
    String(usuarioActual?.idVeterinario ?? '') ===
    String(citaActiva?.idVeterinario ?? '');
  const mascotaCoincide =
    String(idMascota) === String(citaActiva?.idMascota ?? '');
  const puedeRegistrar = Boolean(
    citaActiva?.idCita &&
    citaActiva?.estado === 'En Consulta' &&
    esVeterinario && veterinarioCoincide && mascotaCoincide
  );

  useEffect(() => {
    let activo = true;
    vacunasService.listarVacunas(idMascota)
      .then((datos) => {
        if (activo) setVacunas(Array.isArray(datos) ? datos : []);
      })
      .catch((err) => {
        if (activo) setError(err.message || 'No se pudo cargar la cartilla.');
      });
    return () => { activo = false; };
  }, [idMascota]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!puedeRegistrar) {
      setError('Solo el veterinario responsable puede registrar vacunas durante una consulta activa.');
      return;
    }
    if (formulario.proximaDosis && formulario.proximaDosis <= fechaActual) {
      setError('La próxima dosis debe ser posterior a la fecha de aplicación.');
      return;
    }

    try {
      setGuardando(true);
      const guardada = await vacunasService.registrarVacuna(idMascota, {
        idCita: Number(citaActiva.idCita),
        nombreTipoVacuna: formulario.nombreTipoVacuna.trim(),
        lote: formulario.lote.trim(),
        proximaDosis: formulario.proximaDosis || null
      });

      // El POST ya se guardó: volver de inmediato evita repetirlo si falla un GET posterior.
      // Al volver, RegistrarConsultaPage consulta la cartilla actualizada.
      if (onVacunaRegistrada) onVacunaRegistrada(guardada);
    } catch (err) {
      setError(err.message || 'No se pudo registrar la vacuna.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      {error && (
        <div className="alert-banner-danger" style={{ marginBottom: 16 }}>
          <TriangleAlert size="1em" className="icono-texto" /> {error}
        </div>
      )}

      {puedeRegistrar ? (
        <form onSubmit={handleSubmit} className="cita-card-section">
          <h3 className="section-title-aqua">Registrar Vacuna Aplicada</h3>
          <div className="fields-grid-2">
            <div className="input-group-vet">
              <label>Nombre o Tipo de Vacuna *</label>
              <input
                type="text" name="nombreTipoVacuna" maxLength={100}
                placeholder="Ej. Rabia (Defensor 3)"
                value={formulario.nombreTipoVacuna} onChange={handleChange} required
              />
            </div>
            <div className="input-group-vet">
              <label>Lote *</label>
              <input
                type="text" name="lote" maxLength={50}
                placeholder="Ej. LOTE-RB2026-88"
                value={formulario.lote} onChange={handleChange} required
              />
            </div>
            <div className="input-group-vet">
              <label>Veterinario que aplica *</label>
              <input type="text" value={usuarioActual?.nombre || 'Veterinario autenticado'} disabled readOnly />
              <small style={{ color: '#64748b' }}>Se identifica automáticamente por la sesión.</small>
            </div>
            <div className="input-group-vet">
              <label>Fecha de aplicación *</label>
              <input type="date" value={fechaActual} disabled readOnly />
              <small style={{ color: '#64748b' }}>Se registra automáticamente al guardar.</small>
            </div>
            <div className="input-group-vet">
              <label>Próxima dosis</label>
              <input
                type="date" name="proximaDosis"
                min={diaSiguiente(fechaActual)}
                value={formulario.proximaDosis} onChange={handleChange}
              />
              <small style={{ color: '#64748b', marginTop: 3 }}>
                Opcional. Fecha futura en que corresponderá aplicar el refuerzo.
              </small>
            </div>
          </div>
          <button type="submit" className="btn-confirm-save" disabled={guardando} style={{ marginTop: 16 }}>
            {guardando ? 'Guardando...' : 'Registrar Vacuna y Volver a Consulta'}
          </button>
        </form>
      ) : (
        <div className="cita-card-section" style={{ color: '#64748b' }}>
          <strong>Cartilla en modo consulta (solo lectura).</strong>
          <p style={{ marginTop: 8 }}>
            Para registrar una vacuna, abrí esta cartilla desde una consulta médica en estado
            «En Consulta» con el veterinario responsable conectado.
          </p>
        </div>
      )}

      <div className="cita-card-section">
        <h3 className="section-title-aqua">Cartilla de Vacunación</h3>
        <div style={{ overflowX: 'auto' }}>
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
                  <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>
                    Esta mascota aún no tiene vacunas registradas.
                  </td>
                </tr>
              ) : vacunas.map((vacuna) => (
                <tr key={vacuna.idAplicacionVacuna}>
                  <td><span className="pill-hour-aqua">{formatearFecha(vacuna.fechaAplicacion)}</span></td>
                  <td className="motive-cell-text">{vacuna.nombreTipoVacuna}</td>
                  <td>{vacuna.lote}</td>
                  <td><span className="vet-cell-pill">{vacuna.veterinario?.nombre || '—'}</span></td>
                  <td>{vacuna.proximaDosis ? formatearFecha(vacuna.proximaDosis) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
