
import React, { useState } from 'react';

// PERMISOS SEGÚN EL ROL
const PERMISOS = {
  ADMIN: [
    'dashboard',
    'propietarios',
    'mascotas',
    'expedientes',
    'citas',
    'calendario',
    'espera',
    'consultas',
    'vacunacion',
    'historial',
    'gestion-usuarios'
  ],

  RECEPCIONISTA: [
    'dashboard',
    'propietarios',
    'mascotas',
    'expedientes',
    'citas',
    'calendario',
    'espera'
  ],

  VETERINARIO: [
    'dashboard',
    'expedientes',
    'citas',
    'calendario',
    'espera',
    'consultas',
    'vacunacion',
    'historial'
  ]
};

export default function Sidebar({
  seccionActiva = 'dashboard',
  onSelectSeccion,
  collapsed = false,
  totalCitas = 0,
  enEspera = 0,
  usuario
}) {

  const [openGroups, setOpenGroups] = useState({
    pacientes: true,
    citas: true,
    clinica: true,
    administracion: true
  });

  const rol = usuario?.rol?.toUpperCase() || '';

  const permisos = PERMISOS[rol] || [];

  const puede = (seccion) => permisos.includes(seccion);

  // ABRIR Y CERRAR GRUPOS
  const toggle = (key) => {
    setOpenGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // ENLACES DEL SIDEBAR
  const renderLink = (
    seccion,
    icono,
    texto,
    contador,
    tipo
  ) => {

    if (!puede(seccion)) return null;

    return (
      <button
        type="button"
        onClick={() => onSelectSeccion?.(seccion)}
        className={`sidebar-link-clean ${
          seccionActiva === seccion ? 'active' : ''
        }`}
        title={texto}
      >

        <span className="link-icon">
          {icono}
        </span>

        {!collapsed && (
          <span className="link-text">
            {texto}
          </span>
        )}

        {!collapsed && contador !== undefined && (
          <span
            className={
              tipo === 'amber'
                ? 'badge-amber-clean'
                : 'badge-aqua-clean'
            }
          >
            {contador}
          </span>
        )}

      </button>
    );
  };

  // GRUPOS DEL SIDEBAR
  const renderGrupo = (
    clave,
    titulo,
    secciones,
    contenido
  ) => {

    if (!secciones.some(puede)) return null;

    return (
      <div className="nav-section-clean">

        {!collapsed && (
          <div
            className="section-header-clean"
            onClick={() => toggle(clave)}
          >
            <span>{titulo}</span>

            <span className="chevron-icon">
              {openGroups[clave] ? '▾' : '▸'}
            </span>
          </div>
        )}

        {(openGroups[clave] || collapsed) && (
          <div className="section-links-clean">
            {contenido}
          </div>
        )}

      </div>
    );
  };

  return (
    <aside
      className={`sidebar-clean ${
        collapsed ? 'collapsed' : ''
      }`}
    >

      {/* DASHBOARD */}
      <div className="nav-section-clean">
        {renderLink(
          'dashboard',
          '⊞',
          'Dashboard'
        )}
      </div>

      {/* PACIENTES Y CLIENTES */}
      {renderGrupo(
        'pacientes',
        'PACIENTES Y CLIENTES',
        [
          'propietarios',
          'mascotas',
          'expedientes'
        ],
        <>
          {renderLink(
            'propietarios',
            '👥',
            'Propietarios'
          )}

          {renderLink(
            'mascotas',
            '🐾',
            'Mascotas'
          )}

          {renderLink(
            'expedientes',
            '📁',
            'Expedientes'
          )}
        </>
      )}

      {/* RECEPCIÓN Y CITAS */}
      {renderGrupo(
        'citas',
        'RECEPCIÓN Y CITAS',
        [
          'citas',
          'calendario',
          'espera'
        ],
        <>
          {renderLink(
            'citas',
            '🗓️',
            'Citas del Día',
            totalCitas,
            'aqua'
          )}

          {renderLink(
            'calendario',
            '📅',
            'Calendario y Agenda'
          )}

          {renderLink(
            'espera',
            '⏳',
            'Cola de Espera',
            enEspera,
            'amber'
          )}
        </>
      )}

      {/* ÁREA CLÍNICA */}
      {renderGrupo(
        'clinica',
        'ÁREA CLÍNICA',
        [
          'consultas',
          'vacunacion',
          'historial'
        ],
        <>
          {renderLink(
            'consultas',
            '🩺',
            'Consultas Médicas'
          )}

          {renderLink(
            'vacunacion',
            '💉',
            'Vacunación'
          )}

          {renderLink(
            'historial',
            '📋',
            'Historial Clínico'
          )}
        </>
      )}

      {/* ADMINISTRACIÓN: SOLO ADMIN */}
      {renderGrupo(
        'administracion',
        'ADMINISTRACIÓN',
        ['gestion-usuarios'],
        <>
          {renderLink(
            'gestion-usuarios',
            '👤',
            'Gestión de usuarios'
          )}
        </>
      )}

    </aside>
  );
}
