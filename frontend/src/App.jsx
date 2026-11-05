
import React, { useState } from 'react';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

import ProgramarCitaPage from './modulos/citas/ProgramarCitaPage';
import CalendarioCitasPage from './modulos/citas/CalendarioCitasPage';

import ConsultarPropietariosPage from './modulos/propietarios/ConsultarPropietariosPage';
import RegistroPropietarioPage from './modulos/propietarios/RegistroPropietarioPage';

import RegistrarConsultaPage from './modulos/consultas/RegistrarConsultaPage';
import VacunasPage from './modulos/vacunas/VacunasPage';

import RegistrarMascotaPage from './modulos/mascotas/RegistrarMascotaPage';
import LoginPage from './modulos/autenticacion/LoginPage';
import GestionUsuariosPage from './modulos/usuarios/GestionUsuariosPage';

import './App.css';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default function App() {

  // =========================
  // ESTADOS GENERALES
  // =========================

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [vistaActual, setVistaActual] = useState('dashboard');

  const [citaConsultaSeleccionada, setCitaConsultaSeleccionada] =
    useState(null);

  const [
    mascotaVacunacionSeleccionada,
    setMascotaVacunacionSeleccionada
  ] = useState(null);

  // =========================
  // CITAS
  // =========================

  const [citas, setCitas] = useState([
    {
      id: 1,
      hora: '08:00',
      fecha: new Date().toISOString().split('T')[0],
      mascota: 'Max',
      icono: '🐶',
      dueno: 'María Rodríguez',
      vet: 'Dr. Morales',
      veterinario: 'Dr. Morales',
      motivo: 'Consulta general',
      estado: 'Atendida',
      espera: null
    },
    {
      id: 2,
      hora: '09:00',
      fecha: new Date().toISOString().split('T')[0],
      mascota: 'Luna',
      icono: '🐱',
      dueno: 'Ana Martínez',
      vet: 'Dra. García',
      veterinario: 'Dra. García',
      motivo: 'Control rutina',
      estado: 'En espera',
      espera: '23 min esperando',
      alerta: true
    },
    {
      id: 3,
      hora: '10:00',
      fecha: new Date().toISOString().split('T')[0],
      mascota: 'Rocky',
      icono: '🐩',
      dueno: 'Carlos López',
      vet: 'Dr. Morales',
      veterinario: 'Dr. Morales',
      motivo: 'Vacunación',
      estado: 'En espera',
      espera: '8 min esperando',
      alerta: false
    },
    {
      id: 4,
      hora: '10:30',
      fecha: new Date().toISOString().split('T')[0],
      mascota: 'Pico',
      icono: '🦜',
      dueno: 'José Pérez',
      vet: 'Dr. Santos',
      veterinario: 'Dr. Santos',
      motivo: 'Revisión anual',
      estado: 'En espera',
      espera: '8 min esperando',
      alerta: false
    },
    {
      id: 5,
      hora: '11:00',
      fecha: new Date().toISOString().split('T')[0],
      mascota: 'Miel',
      icono: '🐱',
      dueno: 'Laura Hernández',
      vet: 'Dra. García',
      veterinario: 'Dra. García',
      motivo: 'Desparasitación',
      estado: 'Programada',
      espera: null
    },
    {
      id: 6,
      hora: '14:00',
      fecha: new Date().toISOString().split('T')[0],
      mascota: 'Max',
      icono: '🐶',
      dueno: 'María Rodríguez',
      vet: 'Dr. Santos',
      veterinario: 'Dr. Santos',
      motivo: 'Seguimiento',
      estado: 'Programada',
      espera: null
    }
  ]);

  // =========================
  // AUTENTICACIÓN
  // =========================

  const esAdministrador = usuarioActual?.rol === 'ADMIN';

  const handleLogin = (usuario) => {
    setUsuarioActual(usuario);
    setVistaActual('dashboard');
    setCitaConsultaSeleccionada(null);
    setMascotaVacunacionSeleccionada(null);
    setSidebarCollapsed(false);
  };

  const handleCerrarSesion = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/logout`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error('No se pudo cerrar la sesión.');
      }

      setUsuarioActual(null);
      setVistaActual('dashboard');
      setCitaConsultaSeleccionada(null);
      setMascotaVacunacionSeleccionada(null);
      setSidebarCollapsed(false);

    } catch (error) {
      console.error('Error al cerrar sesión:', error);

      alert('No se pudo cerrar la sesión. Intentá nuevamente.');

      throw error;
    }
  };

  // =========================
  // GESTIÓN DE USUARIOS
  // =========================

  const handleAbrirGestionUsuarios = () => {
    if (!esAdministrador) {
      alert('No tenés permisos para gestionar usuarios.');
      return;
    }

    setVistaActual('gestion-usuarios');
  };

  // =========================
  // CITAS
  // =========================

  const handleAgregarCita = (nuevaCita) => {
    setCitas(prev => [nuevaCita, ...prev]);
  };

  // =========================
  // NAVEGACIÓN
  // =========================

  const handleNavegacion = (seccion) => {

    if (seccion === 'gestion-usuarios') {
      handleAbrirGestionUsuarios();
      return;
    }

    if (
      seccion === 'citas' ||
      seccion === 'programar-cita'
    ) {
      setVistaActual('programar-cita');

    } else if (seccion === 'calendario') {
      setVistaActual('calendario');

    } else if (seccion === 'propietarios') {
      setVistaActual('propietarios');

    } else if (seccion === 'consultas') {
      setCitaConsultaSeleccionada(null);
      setVistaActual('consultas');

    } else {
      setVistaActual(seccion);
    }
  };

  // =========================
  // LOGIN
  // =========================

  if (!usuarioActual) {
    return (
      <LoginPage
        onLogin={handleLogin}
      />
    );
  }

  // =========================
  // SISTEMA PRINCIPAL
  // =========================

  return (
    <div className="app-container">

      {/* NAVBAR */}
      <Navbar
        onToggleSidebar={() =>
          setSidebarCollapsed(!sidebarCollapsed)
        }
        isSidebarCollapsed={sidebarCollapsed}
        usuario={usuarioActual}
        onCerrarSesion={handleCerrarSesion}
        onGestionUsuarios={handleAbrirGestionUsuarios}
      />

      <div className="app-body">

        {/* SIDEBAR */}
       <Sidebar
        collapsed={sidebarCollapsed}
        usuario={usuarioActual}
        seccionActiva={
          vistaActual === 'programar-cita'
            ? 'citas'
            : vistaActual === 'registrar-propietario'
              ? 'propietarios'
              : vistaActual
        }
        onSelectSeccion={handleNavegacion}
        totalCitas={citas.length}
        enEspera={
          citas.filter(
            c =>
              c.estado === 'En espera' ||
              c.estado === 'En Sala de Espera'
          ).length
        }
      />

        {/* CONTENIDO PRINCIPAL */}
        <main className="content-viewport">

          {/* GESTIÓN DE USUARIOS: SOLO ADMIN */}
          {vistaActual === 'gestion-usuarios' && esAdministrador ? (

            <GestionUsuariosPage
              onVolver={() => setVistaActual('dashboard')}
            />

          ) : vistaActual === 'programar-cita' ? (

            <ProgramarCitaPage
              citasExistentes={citas}
              onCitaGuardada={handleAgregarCita}
              onVolver={() =>
                setVistaActual('dashboard')
              }
            />

          ) : vistaActual === 'calendario' ? (

            <CalendarioCitasPage
              onVolver={() =>
                setVistaActual('dashboard')
              }
              onIrAProgramar={() =>
                setVistaActual('programar-cita')
              }
            />

          ) : vistaActual === 'consultas' ? (

            <RegistrarConsultaPage
              citaInicial={citaConsultaSeleccionada}
              onVolver={() => {
                setCitaConsultaSeleccionada(null);
                setVistaActual('dashboard');
              }}
              onAbrirVacunacion={(idMascota) => {
                setMascotaVacunacionSeleccionada(idMascota);
                setVistaActual('vacunacion');
              }}
            />

          ) : vistaActual === 'propietarios' ? (

            <ConsultarPropietariosPage
              onIrARegistro={() =>
                setVistaActual('registrar-propietario')
              }
              onVolverDashboard={() =>
                setVistaActual('dashboard')
              }
            />

          ) : vistaActual === 'registrar-propietario' ? (

            <RegistroPropietarioPage
              onVolver={() =>
                setVistaActual('propietarios')
              }
              onPropietarioGuardado={(nuevo) => {
                console.log(
                  'Propietario registrado con éxito:',
                  nuevo
                );
              }}
            />

          ) : vistaActual === 'vacunacion' ? (

            <VacunasPage
              idMascotaInicial={mascotaVacunacionSeleccionada}
              onVolver={() => {
                setMascotaVacunacionSeleccionada(null);
                setVistaActual('consultas');
              }}
            />

          ) : vistaActual === 'mascotas' ? (

            <RegistrarMascotaPage
              onVolver={() =>
                setVistaActual('dashboard')
              }
            />

          ) : (

           <Dashboard
            usuario={usuarioActual}
            citasData={citas}
            setCitasData={setCitas}
            onIrAProgramar={() => setVistaActual('programar-cita')}
            onIniciarConsulta={(cita) => {
              if (
                usuarioActual?.rol !== 'VETERINARIO' ||
                String(usuarioActual.idVeterinario) !== String(cita.idVeterinario)
              ) {
                return;
              }

              setCitaConsultaSeleccionada(cita);
              setVistaActual('consultas');
            }}
          />

          )}

        </main>
      </div>
    </div>
  );
}
