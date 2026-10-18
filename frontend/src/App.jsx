import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProgramarCitaPage from './modulos/citas/ProgramarCitaPage';
import CalendarioCitasPage from './modulos/citas/CalendarioCitasPage';
import RegistroPropietarioPage from './modulos/propietarios/RegistroPropietarioPage';
import './App.css';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 'dashboard' | 'programar-cita' | 'calendario' | 'propietarios'
  const [vistaActual, setVistaActual] = useState('dashboard');

  const [citas, setCitas] = useState([
    { id: 1, hora: '08:00', fecha: new Date().toISOString().split('T')[0], mascota: 'Max', icono: '🐶', dueno: 'María Rodríguez', vet: 'Dr. Morales', veterinario: 'Dr. Morales', motivo: 'Consulta general', estado: 'Atendida', espera: null },
    { id: 2, hora: '09:00', fecha: new Date().toISOString().split('T')[0], mascota: 'Luna', icono: '🐱', dueno: 'Ana Martínez', vet: 'Dra. García', veterinario: 'Dra. García', motivo: 'Control rutina', estado: 'En espera', espera: '23 min esperando', alerta: true },
    { id: 3, hora: '10:00', fecha: new Date().toISOString().split('T')[0], mascota: 'Rocky', icono: '🐩', dueno: 'Carlos López', vet: 'Dr. Morales', veterinario: 'Dr. Morales', motivo: 'Vacunación', estado: 'En espera', espera: '8 min esperando', alerta: false },
    { id: 4, hora: '10:30', fecha: new Date().toISOString().split('T')[0], mascota: 'Pico', icono: '🦜', dueno: 'José Pérez', vet: 'Dr. Santos', veterinario: 'Dr. Santos', motivo: 'Revisión anual', estado: 'En espera', espera: '8 min esperando', alerta: false },
    { id: 5, hora: '11:00', fecha: new Date().toISOString().split('T')[0], mascota: 'Miel', icono: '🐱', dueno: 'Laura Hernández', vet: 'Dra. García', veterinario: 'Dra. García', motivo: 'Desparasitación', estado: 'Programada', espera: null },
    { id: 6, hora: '14:00', fecha: new Date().toISOString().split('T')[0], mascota: 'Max', icono: '🐶', dueno: 'María Rodríguez', vet: 'Dr. Santos', veterinario: 'Dr. Santos', motivo: 'Seguimiento', estado: 'Programada', espera: null }
  ]);

  const handleAgregarCita = (nuevaCita) => {
    setCitas(prev => [nuevaCita, ...prev]);
  };

  const handleNavegacion = (seccion) => {
    if (seccion === 'citas' || seccion === 'programar-cita') {
      setVistaActual('programar-cita');
    } else if (seccion === 'calendario') {
      setVistaActual('calendario');
    } else if (seccion === 'propietarios') {
      setVistaActual('propietarios');
    } else {
      setVistaActual(seccion);
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        isSidebarCollapsed={sidebarCollapsed}
      />

      <div className="app-body">
        <Sidebar 
          collapsed={sidebarCollapsed}
          seccionActiva={vistaActual === 'programar-cita' ? 'citas' : vistaActual}
          onSelectSeccion={handleNavegacion}
          totalCitas={citas.length}
          enEspera={citas.filter(c => c.estado === 'En espera' || c.estado === 'En Sala de Espera').length}
        />

        <main className="content-viewport">
          {vistaActual === 'programar-cita' ? (
            <ProgramarCitaPage
              citasExistentes={citas}
              onCitaGuardada={handleAgregarCita}
              onVolver={() => setVistaActual('dashboard')}
            />
          ) : vistaActual === 'calendario' ? (
            <CalendarioCitasPage
              onVolver={() => setVistaActual('dashboard')}
              onIrAProgramar={() => setVistaActual('programar-cita')}
            />
          ) : vistaActual === 'propietarios' ? (
            <RegistroPropietarioPage
              onVolver={() => setVistaActual('dashboard')}
              onPropietarioGuardado={(nuevo) => {
                console.log('Propietario registrado con éxito:', nuevo);
              }}
            />
          ) : (
            <Dashboard 
              citasData={citas}
              setCitasData={setCitas}
              onIrAProgramar={() => setVistaActual('programar-cita')}
            />
          )}
        </main>
      </div>
    </div>
  );
}