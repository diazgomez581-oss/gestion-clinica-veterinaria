import React, { useState } from 'react';

export default function Sidebar({ seccionActiva = 'citas', onSelectSeccion, collapsed = false, totalCitas = 0, enEspera = 0 }) {
  const [openGroups, setOpenGroups] = useState({ pacientes: true, citas: true, clinica: true });

  const toggle = (key) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <aside className={`sidebar-clean ${collapsed ? 'collapsed' : ''}`}>
      {/* Dashboard General */}
      <div className="nav-section-clean">
        <button
          onClick={() => onSelectSeccion('dashboard')}
          className={`sidebar-link-clean ${seccionActiva === 'dashboard' ? 'active' : ''}`}
          title="Dashboard"
        >
          <span className="link-icon">⊞</span>
          {!collapsed && <span className="link-text">Dashboard</span>}
        </button>
      </div>

      {/* Pacientes y Clientes */}
      <div className="nav-section-clean">
        {!collapsed && (
          <div className="section-header-clean" onClick={() => toggle('pacientes')}>
            <span>PACIENTES Y CLIENTES</span>
            <span className="chevron-icon">{openGroups.pacientes ? '▾' : '▸'}</span>
          </div>
        )}
        {(openGroups.pacientes || collapsed) && (
          <div className="section-links-clean">
            <button
              onClick={() => onSelectSeccion('propietarios')}
              className={`sidebar-link-clean ${seccionActiva === 'propietarios' ? 'active' : ''}`}
              title="Propietarios"
            >
              <span className="link-icon">👥</span>
              {!collapsed && <span className="link-text">Propietarios</span>}
            </button>
            <button
              onClick={() => onSelectSeccion('mascotas')}
              className={`sidebar-link-clean ${seccionActiva === 'mascotas' ? 'active' : ''}`}
              title="Mascotas"
            >
              <span className="link-icon">🐾</span>
              {!collapsed && <span className="link-text">Mascotas</span>}
            </button>
            <button
              onClick={() => onSelectSeccion('expedientes')}
              className={`sidebar-link-clean ${seccionActiva === 'expedientes' ? 'active' : ''}`}
              title="Expedientes"
            >
              <span className="link-icon">📁</span>
              {!collapsed && <span className="link-text">Expedientes</span>}
            </button>
          </div>
        )}
      </div>

      {/* Recepción y Citas */}
      <div className="nav-section-clean">
        {!collapsed && (
          <div className="section-header-clean" onClick={() => toggle('citas')}>
            <span>RECEPCIÓN Y CITAS</span>
            <span className="chevron-icon">{openGroups.citas ? '▾' : '▸'}</span>
          </div>
        )}
        {(openGroups.citas || collapsed) && (
          <div className="section-links-clean">
            <button
              onClick={() => onSelectSeccion('citas')}
              className={`sidebar-link-clean ${seccionActiva === 'citas' ? 'active' : ''}`}
              title="Citas del Día"
            >
              <span className="link-icon">🗓️</span>
              {!collapsed && <span className="link-text">Citas del Día</span>}
              {!collapsed && <span className="badge-aqua-clean">{totalCitas}</span>}
            </button>
            <button
              onClick={() => onSelectSeccion('calendario')}
              className={`sidebar-link-clean ${seccionActiva === 'calendario' ? 'active' : ''}`}
              title="Calendario y Agenda"
            >
              <span className="link-icon">📅</span>
              {!collapsed && <span className="link-text">Calendario y Agenda</span>}
            </button>
            <button
              onClick={() => onSelectSeccion('espera')}
              className={`sidebar-link-clean ${seccionActiva === 'espera' ? 'active' : ''}`}
              title="Cola de Espera"
            >
              <span className="link-icon">⏳</span>
              {!collapsed && <span className="link-text">Cola de Espera</span>}
              {!collapsed && <span className="badge-amber-clean">{enEspera}</span>}
            </button>
          </div>
        )}
      </div>

      {/* Área Clínica */}
      <div className="nav-section-clean">
        {!collapsed && (
          <div className="section-header-clean" onClick={() => toggle('clinica')}>
            <span>ÁREA CLÍNICA</span>
            <span className="chevron-icon">{openGroups.clinica ? '▾' : '▸'}</span>
          </div>
        )}
        {(openGroups.clinica || collapsed) && (
          <div className="section-links-clean">
            <button
              onClick={() => onSelectSeccion('consultas')}
              className={`sidebar-link-clean ${seccionActiva === 'consultas' ? 'active' : ''}`}
              title="Consultas Médicas"
            >
              <span className="link-icon">🩺</span>
              {!collapsed && <span className="link-text">Consultas Médicas</span>}
            </button>
            <button
              onClick={() => onSelectSeccion('vacunacion')}
              className={`sidebar-link-clean ${seccionActiva === 'vacunacion' ? 'active' : ''}`}
              title="Vacunación"
            >
              <span className="link-icon">💉</span>
              {!collapsed && <span className="link-text">Vacunación</span>}
            </button>
            <button
              onClick={() => onSelectSeccion('historial')}
              className={`sidebar-link-clean ${seccionActiva === 'historial' ? 'active' : ''}`}
              title="Historial Clínico"
            >
              <span className="link-icon">📋</span>
              {!collapsed && <span className="link-text">Historial Clínico</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}