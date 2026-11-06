
import React, { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, ClipboardList, Clock3, FolderOpen, LayoutDashboard, PawPrint, Stethoscope, Syringe, User, Users } from 'lucide-react';

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

  const toggle = (key) => {
    setOpenGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderLink = (
    seccion,
    Icono,
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
          <Icono size={18} strokeWidth={1.9} />
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
              {openGroups[clave] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
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

      <div className="nav-section-clean">
        {renderLink(
          'dashboard',
          LayoutDashboard,
          'Dashboard'
        )}
      </div>

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
            Users,
            'Propietarios'
          )}

          {renderLink(
            'mascotas',
            PawPrint,
            'Mascotas'
          )}

          {renderLink(
            'expedientes',
            FolderOpen,
            'Expedientes'
          )}
        </>
      )}

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
            CalendarDays,
            'Citas del Día',
            totalCitas,
            'aqua'
          )}

          {renderLink(
            'calendario',
            CalendarDays,
            'Calendario y Agenda'
          )}

          {renderLink(
            'espera',
            Clock3,
            'Cola de Espera',
            enEspera,
            'amber'
          )}
        </>
      )}

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
            Stethoscope,
            'Consultas Médicas'
          )}

          {renderLink(
            'vacunacion',
            Syringe,
            'Vacunación'
          )}

          {renderLink(
            'historial',
            ClipboardList,
            'Historial Clínico'
          )}
        </>
      )}

      {renderGrupo(
        'administracion',
        'ADMINISTRACIÓN',
        ['gestion-usuarios'],
        <>
          {renderLink(
            'gestion-usuarios',
            User,
            'Gestión de usuarios'
          )}
        </>
      )}

    </aside>
  );
}
