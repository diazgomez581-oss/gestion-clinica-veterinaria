
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
import ProximasVacunasPage from './modulos/vacunas/ProximasVacunasPage';
import HistorialClinicoPage from './modulos/historial/HistorialClinicoPage';

import RegistrarMascotaPage from './modulos/mascotas/RegistrarMascotaPage';
import ListadoMascotasPage from './modulos/mascotas/ListadoMascotasPage';
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
  const vacunacionDesdeConsulta = vistaActual === 'vacunacion-consulta';
  const [mensajeVacunacion, setMensajeVacunacion] = useState('');

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
    setMensajeVacunacion('');
    setSidebarCollapsed(false);
  };
  const [refuerzoParaCita, setRefuerzoParaCita] = useState(null);

  const puedeAgendarRefuerzo = ['ADMIN', 'RECEPCIONISTA'].includes(
    usuarioActual?.rol?.toUpperCase()
  );
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
      setMensajeVacunacion('');
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
      setMensajeVacunacion('');
      setVistaActual('consultas');

    } else if (seccion === 'vacunacion') {
      // La entrada directa es de consulta de cartilla (solo lectura).
      // Para aplicar vacunas hay que llegar desde una consulta activa.
      setCitaConsultaSeleccionada(null);
      setMascotaVacunacionSeleccionada(null);
      setMensajeVacunacion('');
      setVistaActual('vacunacion');

    } else {
      setVistaActual(seccion);
    }
  };

  // =========================
  // AGENDAR REFUERZO
  // =========================
  const handleAgendarRefuerzo = (vacuna) => {
    if (!puedeAgendarRefuerzo) return;

    if (
      vacuna?.idAplicacionVacuna == null ||
      vacuna?.idMascota == null ||
      vacuna?.idPropietario == null ||
      !vacuna?.proximaDosis
    ) {
      window.alert(
        'Faltan los identificadores del refuerzo, mascota o propietario. ' +
        'Revisá que el backend devuelva esos datos.'
      );
      return;
    }

    if (vacuna.idCitaAgendada != null) {
      window.alert('Este refuerzo ya tiene una cita agendada.');
      return;
    }

    setRefuerzoParaCita(vacuna);
    setVistaActual('programar-cita-refuerzo');
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
          
          // DASHBOARD
          ) : (
            vistaActual === 'programar-cita' ||
            vistaActual === 'programar-cita-refuerzo'
          ) ? (

            <ProgramarCitaPage
              key={vistaActual}
              citasExistentes={citas}
              refuerzoInicial={
                vistaActual === 'programar-cita-refuerzo'
                  ? refuerzoParaCita
                  : null
              }
              onCitaGuardada={handleAgregarCita}
              onVolver={() => {
                const desdeRefuerzo = vistaActual === 'programar-cita-refuerzo';

                setRefuerzoParaCita(null);
                setVistaActual(
                  desdeRefuerzo ? 'proximas-vacunas' : 'dashboard'
                );
              }}
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
              mensajeVacunacion={mensajeVacunacion}
              onVolver={() => {
                setCitaConsultaSeleccionada(null);
                setMensajeVacunacion('');
                setVistaActual('dashboard');
              }}
              onAbrirVacunacion={(cita) => {
                if (cita?.idCita == null || cita?.idMascota == null || cita.estado !== 'En Consulta') {
                  window.alert('Seleccioná una cita activa para abrir su cartilla de vacunación.');
                  return;
                }

                setCitaConsultaSeleccionada(cita);
                setMensajeVacunacion('');
                setVistaActual('vacunacion-consulta');
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

          ) : vistaActual === 'proximas-vacunas' ? (

            <ProximasVacunasPage
              onVolver={() => setVistaActual('dashboard')}
              onAgendarCita={
                puedeAgendarRefuerzo ? handleAgendarRefuerzo : undefined
              }
            />

          ) : (vistaActual === 'vacunacion' || vacunacionDesdeConsulta) ? (

            <VacunasPage
              idMascotaInicial={
                vacunacionDesdeConsulta ? citaConsultaSeleccionada?.idMascota : null
              }
              citaActiva={vacunacionDesdeConsulta ? citaConsultaSeleccionada : null}
              usuarioActual={usuarioActual}
              onVacunaRegistrada={(vacuna) => {
                setMensajeVacunacion(
                  `Vacuna «${vacuna.nombreTipoVacuna}» registrada correctamente. ` +
                  'Ya podés finalizar la consulta.'
                );
                setVistaActual('consultas');
              }}
              onVolver={() => {
                setVistaActual(vacunacionDesdeConsulta ? 'consultas' : 'dashboard');
              }}
            />
          ) : vistaActual === 'historial' ? (
              <HistorialClinicoPage
                onVolver={() => setVistaActual('dashboard')}
              />
            ) : vistaActual === 'mascotas' ? (

          <ListadoMascotasPage
            onAgregarMascota={() =>
              setVistaActual('registrar-mascota')
            }
          />

        ) : vistaActual === 'registrar-mascota' ? (

          <RegistrarMascotaPage
            onVolver={() =>
              setVistaActual('mascotas')
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
              setMensajeVacunacion('');
              setVistaActual('consultas');
            }}
          />

          )}

        </main>
      </div>
    </div>
  );
}
