import React, { useState, useEffect } from 'react';
import { citasService } from '../citas/citasService';
import CartillaVacunas from './CartillaVacunas';

export default function VacunasPage({ onVolver }) {
  const [mascotas, setMascotas] = useState([]);
  const [idMascota, setIdMascota] = useState('');

  useEffect(() => {
    citasService.getMascotas().then(data => setMascotas(data || []));
  }, []);

  return (
    <div className="cita-page-container">
      {/* Header */}
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link" style={{ cursor: 'pointer' }}>Dashboard</span> &gt; <span>Vacunación</span>
          </div>
          <h1 className="cita-page-title">Cartilla de Vacunación</h1>
          <p className="cita-page-sub">Historia GCV-10 [VAC-01] · Registro de vacunas aplicadas a una mascota</p>
        </div>

        <button type="button" onClick={onVolver} className="btn-volver-dash">
          ← Volver al Dashboard
        </button>
      </div>

      {/* Selección de mascota */}
      <div className="cita-card-section">
        <div className="input-group-vet">
          <label>Mascota *</label>
          <select value={idMascota} onChange={(e) => setIdMascota(e.target.value)}>
            <option value="">-- Seleccione una mascota --</option>
            {mascotas.map(m => (
              <option key={m.idMascota} value={m.idMascota}>
                🐾 {m.nombre} · {m.especie} ({m.codigoExpediente})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* key reinicia formulario y mensajes al cambiar de mascota */}
      {idMascota && <CartillaVacunas key={idMascota} idMascota={idMascota} />}
    </div>
  );
}
