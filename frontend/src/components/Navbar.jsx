import React, { useState } from 'react';
import logoVet from '../assets/icono_vetues.png'; // Importación de tu logo

export default function Navbar({ onToggleSidebar, isSidebarCollapsed }) {
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  return (
    <header className="top-navbar-clean">
      {/* 1. Izquierda: Hamburguesa + Logo Oficial + Título */}
      <div className="nav-left-group">
        <button 
          className="btn-hamburguer-clean" 
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? "Maximizar menú" : "Minimizar menú"}
        >
          ☰
        </button>

        {/* Logo e Identidad de la Veterinaria UES */}
        <div className="brand-logo-container">
          <img 
            src={logoVet} 
            alt="Logo Veterinaria UES" 
            className="navbar-logo-img" 
          />
          <div className="brand-clean-box">
            <span className="brand-title-clean">Gestión de Clínica Veterinaria</span>
            <span className="brand-univ-tag">Universidad de El Salvador (UES)</span>
          </div>
        </div>
      </div>

      {/* 2. Centro: Barra de Búsqueda */}
      <div className="nav-center-group">
        <div className="search-bar-clean">
          <span className="search-icon-clean">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por paciente, propietario o expediente..." 
            className="search-field-clean"
          />
        </div>
      </div>

      {/* 3. Derecha: Perfil con Menú (Solo Perfil y Cerrar Sesión) */}
      <div className="nav-right-group">
        <span className="tag-faculty">UES · FIA</span>

        <div className="user-menu-relative">
          <button 
            className="btn-user-avatar-clean"
            onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
            title="Menú de usuario"
          >
            👤
          </button>

          {menuUsuarioAbierto && (
            <div className="dropdown-box-clean">
              <div className="dropdown-user-info">
                <span className="user-name-text">Jonathan Gómez</span>
                <span className="user-role-text">Recepcionista · TOO115</span>
              </div>
              <hr className="dropdown-divider-clean" />
              <button 
                className="dropdown-btn-clean"
                onClick={() => setMenuUsuarioAbierto(false)}
              >
                👤 Perfil
              </button>
              <button 
                className="dropdown-btn-clean btn-logout-clean"
                onClick={() => {
                  setMenuUsuarioAbierto(false);
                  alert("Sesión finalizada");
                }}
              >
                🚪 Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}