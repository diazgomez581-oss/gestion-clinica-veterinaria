import React, { useState } from 'react';
import { propietariosService } from './propietariosService';

export default function RegistroPropietarioPage({ onPropietarioGuardado, onVolver }) {
  const [formulario, setFormulario] = useState({
    nombres: '',
    apellidos: '',
    dui: '',
    telefono: '',
    correo: '',
    direccion: ''
  });

  const [errorValidacion, setErrorValidacion] = useState('');
  const [exitoMensaje, setExitoMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Formateador automático de DUI (########-#)
  const formatearDUI = (valor) => {
    const soloNumeros = valor.replace(/\D/g, '').slice(0, 9);
    if (soloNumeros.length > 8) {
      return `${soloNumeros.slice(0, 8)}-${soloNumeros.slice(8)}`;
    }
    return soloNumeros;
  };

  // Formateador automático de Teléfono (####-####)
  const formatearTelefono = (valor) => {
    const soloNumeros = valor.replace(/\D/g, '').slice(0, 8);
    if (soloNumeros.length > 4) {
      return `${soloNumeros.slice(0, 4)}-${soloNumeros.slice(4)}`;
    }
    return soloNumeros;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let valorFormateado = value;

    if (name === 'dui') {
      valorFormateado = formatearDUI(value);
    } else if (name === 'telefono') {
      valorFormateado = formatearTelefono(value);
    }

    setFormulario(prev => ({
      ...prev,
      [name]: valorFormateado
    }));

    if (errorValidacion) setErrorValidacion('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorValidacion('');
    setExitoMensaje(null);

    // Validación de campos obligatorios (Criterio 1)
    if (!formulario.nombres.trim() || !formulario.apellidos.trim()) {
      setErrorValidacion('Por favor ingresa los nombres y apellidos completos del propietario.');
      return;
    }

    // Validación de formato DUI: 8 dígitos + guion + 1 dígito (Criterio 2)
    const regexDui = /^\d{8}-\d{1}$/;
    if (!regexDui.test(formulario.dui.trim())) {
      setErrorValidacion('El DUI debe tener un formato válido de 9 dígitos (ej. 05123456-7).');
      return;
    }

    if (!formulario.telefono.trim()) {
      setErrorValidacion('El número de teléfono de contacto es obligatorio.');
      return;
    }

    if (!formulario.direccion.trim()) {
      setErrorValidacion('La dirección de residencia es obligatoria.');
      return;
    }

    // Payload limpio hacia la API de Spring Boot
    const payload = {
      nombres: formulario.nombres.trim(),
      apellidos: formulario.apellidos.trim(),
      dui: formulario.dui.trim(),
      telefono: formulario.telefono.trim(),
      correo: formulario.correo.trim() || null,
      direccion: formulario.direccion.trim()
    };

    try {
      setGuardando(true);
      const propietarioGuardado = await propietariosService.registrar(payload);

      // Confirmación con ID asignado (Criterio 3)
      setExitoMensaje({
        id: propietarioGuardado.idPropietario,
        nombre: `${propietarioGuardado.nombres} ${propietarioGuardado.apellidos}`,
        dui: propietarioGuardado.dui
      });

      if (onPropietarioGuardado) {
        onPropietarioGuardado(propietarioGuardado);
      }

      // Limpiar formulario tras éxito
      setFormulario({
        nombres: '',
        apellidos: '',
        dui: '',
        telefono: '',
        correo: '',
        direccion: ''
      });

      setTimeout(() => {
        if (onVolver) onVolver();
      }, 1800);

    } catch (err) {
      setErrorValidacion(err.message || 'Error al registrar el propietario en el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const nombreCompletoVista = `${formulario.nombres} ${formulario.apellidos}`.trim();

  return (
    <div className="cita-page-container">
      {/* Header */}
      <div className="cita-page-header">
        <div>
          <div className="cita-breadcrumb">
            <span onClick={onVolver} className="breadcrumb-link" style={{ cursor: 'pointer' }}>Dashboard</span> &gt; <span>Gestión de Propietarios</span>
          </div>
          <h1 className="cita-page-title">Registrar Nuevo Propietario</h1>
          <p className="cita-page-sub">Historia GCV-1 [PRO-01] · Alta de cliente responsable y sincronización con PostgreSQL</p>
        </div>

        <button type="button" onClick={onVolver} className="btn-volver-dash">
          ← Volver al Dashboard
        </button>
      </div>

      {/* Banner de Éxito */}
      {exitoMensaje && (
        <div className="alert-banner-success" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '14px 18px', borderRadius: '10px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>✓</span>
          <div>
            <strong>¡Propietario registrado exitosamente!</strong>
            <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>
              Se asignó el identificador único <strong>#{exitoMensaje.id}</strong> a {exitoMensaje.nombre} (DUI: {exitoMensaje.dui}). Redirigiendo...
            </div>
          </div>
        </div>
      )}

      {/* Banner de Error */}
      {errorValidacion && (
        <div className="alert-banner-danger" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
          ⚠️ {errorValidacion}
        </div>
      )}

      <form onSubmit={handleSubmit} className="cita-form-layout">
        {/* COLUMNA IZQUIERDA: Formulario */}
        <div className="cita-form-main">
          {/* Tarjeta 1: Información de Identidad */}
          <div className="cita-card-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 className="section-title-aqua" style={{ margin: 0, border: 'none', padding: 0 }}>
                1. Datos de Identidad Legal
              </h3>
              <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                PostgreSQL · Tabla Propietarios (DUI Único)
              </span>
            </div>

            <div className="fields-grid-2">
              <div className="input-group-vet">
                <label>Nombres del Propietario *</label>
                <input
                  type="text"
                  name="nombres"
                  placeholder="Ej. Carlos Alberto"
                  value={formulario.nombres}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group-vet">
                <label>Apellidos del Propietario *</label>
                <input
                  type="text"
                  name="apellidos"
                  placeholder="Ej. Pérez Ramos"
                  value={formulario.apellidos}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group-vet">
                <label>Número de DUI (8 dígitos - 1 dígito) *</label>
                <input
                  type="text"
                  name="dui"
                  placeholder="00000000-0"
                  maxLength="10"
                  value={formulario.dui}
                  onChange={handleChange}
                  required
                />
                <small style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
                  Restricción única: no se admiten DUIs duplicados en la base de datos.
                </small>
              </div>

              <div className="input-group-vet">
                <label>Teléfono de Contacto *</label>
                <input
                  type="text"
                  name="telefono"
                  placeholder="Ej. 7845-1234"
                  maxLength="9"
                  value={formulario.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Residencia y Contacto Adicional */}
          <div className="cita-card-section">
            <h3 className="section-title-aqua">2. Información de Contacto y Residencia</h3>

            <div className="fields-grid-2">
              <div className="input-group-vet">
                <label>Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  name="correo"
                  placeholder="ejemplo@correo.com"
                  value={formulario.correo}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group-vet" style={{ gridColumn: 'span 2' }}>
                <label>Dirección Completa de Residencia *</label>
                <textarea
                  name="direccion"
                  rows="3"
                  placeholder="Ej. Colonia San Benito, Pasaje Las Flores #123, San Salvador"
                  value={formulario.direccion}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.86rem' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Ficha de Resumen en Vivo */}
        <div className="cita-summary-side">
          <div className="summary-card-sticky">
            <div className="summary-card-header">
              <h4>Ficha del Propietario</h4>
              <span className="summary-badge-status" style={{ background: '#ecfdf5', color: '#059669' }}>Nuevo</span>
            </div>

            <div className="summary-item">
              <span className="summary-label">Nombre Completo</span>
              <strong className="summary-val">
                {nombreCompletoVista || 'Sin ingresar...'}
              </strong>
            </div>

            <div className="summary-item">
              <span className="summary-label">DUI Registrado</span>
              <div className="summary-val" style={{ color: '#0369a1', fontWeight: 700 }}>
                {formulario.dui || '00000000-0'}
              </div>
            </div>

            <div className="summary-item">
              <span className="summary-label">Teléfono</span>
              <div className="summary-val">{formulario.telefono || '---- ----'}</div>
            </div>

            <div className="summary-item">
              <span className="summary-label">Correo Electrónico</span>
              <div className="summary-val" style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>
                {formulario.correo || 'No especificado'}
              </div>
            </div>

            <div className="summary-item">
              <span className="summary-label">Dirección</span>
              <div className="summary-val" style={{ fontSize: '0.76rem', color: '#475569' }}>
                {formulario.direccion || 'Pendiente de ingresar dirección...'}
              </div>
            </div>

            <hr className="summary-divider" />

            <div className="summary-actions">
              <button type="submit" className="btn-confirm-save" disabled={guardando}>
                {guardando ? 'Guardando en BD...' : '✓ Guardar Propietario'}
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