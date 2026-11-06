import React, { useState, useEffect } from 'react';
import { citasService } from '../citas/citasService';
import CartillaVacunas from './CartillaVacunas';
import { ArrowLeft, PawPrint } from 'lucide-react';

export default function VacunasPage({ onVolver, idMascotaInicial = null }) {
  const [mascotas, setMascotas] = useState([]);
  const [idMascota, setIdMascota] = useState(
    idMascotaInicial ? String(idMascotaInicial) : ''
  );

  useEffect(() => {
    setIdMascota(idMascotaInicial ? String(idMascotaInicial) : '');
  }, [idMascotaInicial]);  

  useEffect(() => {
    citasService.getMascotas().then(data => setMascotas(data || []));
  }, []);

  return (
    <div className="cita-page-container">
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link" style={{ cursor: 'pointer' }}>Dashboard</span> &gt; <span>Vacunación</span>
          </div>
          <h1 className="cita-page-title">Cartilla de Vacunación</h1>
          <p className="cita-page-sub">Historia GCV-10 [VAC-01] · Registro de vacunas aplicadas a una mascota</p>
        </div>

        <button type="button" onClick={onVolver} className="btn-volver-dash">
          <ArrowLeft size={16} /> Volver al Dashboard
        </button>
      </div>

      <div className="cita-card-section">
        <div className="input-group-vet">
          <label><PawPrint size={15} /> Mascota *</label>
          <select value={idMascota} onChange={(e) => setIdMascota(e.target.value)}>
            <option value="">-- Seleccione una mascota --</option>
            {mascotas.map(m => (
              <option key={m.idMascota} value={m.idMascota}>
                {m.nombre} · {m.especie} ({m.codigoExpediente})
              </option>
            ))}
          </select>
        </div>
      </div>

      {idMascota && <CartillaVacunas key={idMascota} idMascota={idMascota} />}
    </div>
  );
}
