import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { citasService } from '../citas/citasService';
import CartillaVacunas from './CartillaVacunas';

export default function VacunasPage({
  onVolver,
  idMascotaInicial = null,
  citaActiva = null,
  usuarioActual = null,
  onVacunaRegistrada
}) {
  const [mascotas, setMascotas] = useState([]);
  const [errorMascotas, setErrorMascotas] = useState('');
  const [idMascota, setIdMascota] = useState(
    idMascotaInicial != null ? String(idMascotaInicial) : ''
  );

  // Cuando se abre desde una consulta, la mascota queda fijada a la cita.
  const desdeConsulta = Boolean(citaActiva?.idCita);
  const mascotaBloqueada = desdeConsulta;

  useEffect(() => {
    const idDeConsulta = citaActiva?.idMascota;
    const id = desdeConsulta ? idDeConsulta : idMascotaInicial;
    setIdMascota(id != null ? String(id) : '');
  }, [idMascotaInicial, citaActiva?.idMascota, desdeConsulta]);

  useEffect(() => {
    let activo = true;
    citasService.getMascotas()
      .then((data) => {
        if (activo) setMascotas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (activo) setErrorMascotas('No se pudo cargar el listado de mascotas.');
      });
    return () => { activo = false; };
  }, []);

  return (
    <div className="cita-page-container">
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link" style={{ cursor: 'pointer' }}>
              {desdeConsulta ? 'Consulta médica' : 'Dashboard'}
            </span> &gt; <span>Vacunación</span>
          </div>
          <h1 className="cita-page-title">Cartilla de Vacunación</h1>
          <p className="cita-page-sub">
            {desdeConsulta
              ? 'Aplicación de vacunas al paciente que se encuentra en consulta'
              : 'Consulta del historial de vacunación de una mascota'}
          </p>
        </div>
        <button type="button" onClick={onVolver} className="btn-volver-dash">
          <ArrowLeft size="1em" className="icono-texto" />
          {desdeConsulta ? 'Volver a la consulta' : 'Volver al Dashboard'}
        </button>
      </div>

      <div className="cita-card-section">
        <div className="input-group-vet">
          <label>Mascota *</label>
          <select
            value={idMascota}
            disabled={mascotaBloqueada}
            onChange={(e) => setIdMascota(e.target.value)}
            aria-label="Mascota"
          >
            <option value="">-- Seleccione una mascota --</option>
            {mascotas.map((m) => (
              <option key={m.idMascota} value={m.idMascota}>
                {m.nombre} · {m.especie} ({m.codigoExpediente})
              </option>
            ))}
            {idMascota && !mascotas.some((m) => String(m.idMascota) === idMascota) && (
              <option value={idMascota}>Mascota #{idMascota}</option>
            )}
          </select>
          {mascotaBloqueada && (
            <small style={{ color: '#64748b', marginTop: 6, display: 'block' }}>
              La mascota está vinculada a la consulta activa y no puede cambiarse.
            </small>
          )}
          {errorMascotas && <small style={{ color: '#991b1b' }}>{errorMascotas}</small>}
        </div>
      </div>

      {idMascota && (
        <CartillaVacunas
          key={`${idMascota}-${citaActiva?.idCita ?? 'historial'}`}
          idMascota={idMascota}
          citaActiva={citaActiva}
          usuarioActual={usuarioActual}
          onVacunaRegistrada={onVacunaRegistrada}
        />
      )}
    </div>
  );
}
