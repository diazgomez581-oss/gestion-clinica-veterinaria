
import React, { useState } from 'react';
import logoVet from '../assets/icono_vetues.png';
import { LoaderCircle, LogOut, Menu, Search, User, Users } from 'lucide-react';

export default function Navbar({
  onToggleSidebar,
  isSidebarCollapsed,
  usuario,
  onCerrarSesion,
  onGestionUsuarios
}) {
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const nombreUsuario =
    usuario?.nombre || usuario?.username || 'Usuario';

  const roles = {
    ADMIN: 'Administrador',
    VETERINARIO: 'Veterinario/a',
    DOCTORA: 'Doctora',
    RECEPCIONISTA: 'Recepcionista'
  };

  const rolUsuario =
    roles[usuario?.rol] || usuario?.rol || 'Sin rol';

  const handleCerrarSesion = async () => {
    if (cerrandoSesion) return;

    setCerrandoSesion(true);

    try {
      await onCerrarSesion?.();
      setMenuUsuarioAbierto(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setCerrandoSesion(false);
    }
  };

  const abrirGestionUsuarios = () => {
    setMenuUsuarioAbierto(false);
    onGestionUsuarios?.();
  };

  return (
    <header className="top-navbar-clean">
      <div className="nav-left-group">
        <button
          className="btn-hamburguer-clean"
          onClick={onToggleSidebar}
          title={
            isSidebarCollapsed
              ? 'Maximizar menú'
              : 'Minimizar menú'
          }
        >
          <Menu size={22} />
        </button>

        <div className="brand-logo-container">
          <img
            src={logoVet}
            alt="Logo Veterinaria UES"
            className="navbar-logo-img"
          />

          <div className="brand-clean-box">
            <span className="brand-title-clean">
              Gestión de Clínica Veterinaria
            </span>

            <span className="brand-univ-tag">
              Universidad de El Salvador (UES)
            </span>
          </div>
        </div>
      </div>

      <div className="nav-center-group">
        <div className="search-bar-clean">
          <span className="search-icon-clean"><Search size={18} /></span>

          <input
            type="text"
            placeholder="Buscar por paciente, propietario o expediente..."
            className="search-field-clean"
          />
        </div>
      </div>

      <div className="nav-right-group">
        <span className="tag-faculty">
          {nombreUsuario}
        </span>

        <div className="user-menu-relative">
          <button
            className="btn-user-avatar-clean"
            onClick={() =>
              setMenuUsuarioAbierto(!menuUsuarioAbierto)
            }
            title={`Usuario: ${nombreUsuario}`}
            aria-expanded={menuUsuarioAbierto}
            aria-label="Menú de usuario"
          >
            <User size={19} />
          </button>

          {menuUsuarioAbierto && (
            <div className="dropdown-box-clean">
              <div className="dropdown-user-info">
                <span className="user-name-text">
                  {nombreUsuario}
                </span>

                <span className="user-role-text">
                  {rolUsuario} · TOO115
                </span>
              </div>

              <hr className="dropdown-divider-clean" />

              <button
                className="dropdown-btn-clean"
                onClick={() => setMenuUsuarioAbierto(false)}
              >
                <User size={16} /> Perfil
              </button>

              {usuario?.rol === 'ADMIN' && (
                <button
                  className="dropdown-btn-clean"
                  onClick={abrirGestionUsuarios}
                >
                  <Users size={16} /> Gestionar usuarios
                </button>
              )}

              <button
                className="dropdown-btn-clean btn-logout-clean"
                onClick={handleCerrarSesion}
                disabled={cerrandoSesion}
              >
                {cerrandoSesion ? (
                  <><LoaderCircle size={16} className="lucide-spin" /> Cerrando sesión...</>
                ) : (
                  <><LogOut size={16} /> Cerrar sesión</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
