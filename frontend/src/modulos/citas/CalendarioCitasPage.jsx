import React, { useState, useEffect } from 'react';
import { citasService } from './citasService';

export default function CalendarioCitasPage({ onVolver, onIrAProgramar }) {
  const [vista, setVista] = useState('mes'); // 'mes' | 'agenda'
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fechaActual, setFechaActual] = useState(new Date());

  useEffect(() => {
    async function cargarCitasCalendario() {
      try {
        setCargando(true);
        const data = await citasService.getTodasLasCitas();
        setCitas(data || []);
      } catch (err) {
        console.error('Error al cargar eventos del calendario:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarCitasCalendario();
  }, []);

  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setFechaActual(nuevaFecha);
  };

  const anio = fechaActual.getFullYear();
  const mesIndex = fechaActual.getMonth();
  const nombreMes = fechaActual.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  // Función robusta para normalizar la fecha sin importar si llega como String o como Array [YYYY, MM, DD]
  const normalizarFecha = (fechaInput) => {
    if (!fechaInput) return '';
    if (Array.isArray(fechaInput)) {
      const [y, m, d] = fechaInput;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return String(fechaInput).substring(0, 10);
  };

  // Construcción de la matriz mensual
  const obtenerDiasDelMes = () => {
    const primerDiaDelMes = new Date(anio, mesIndex, 1);
    const ultimoDiaDelMes = new Date(anio, mesIndex + 1, 0);
    
    let diaInicioSemana = primerDiaDelMes.getDay();
    diaInicioSemana = diaInicioSemana === 0 ? 6 : diaInicioSemana - 1; // Lunes = 0

    const dias = [];
    for (let i = 0; i < diaInicioSemana; i++) {
      dias.push({ vacio: true });
    }

    for (let d = 1; d <= ultimoDiaDelMes.getDate(); d++) {
      const mesStr = String(mesIndex + 1).padStart(2, '0');
      const diaStr = String(d).padStart(2, '0');
      const fechaStr = `${anio}-${mesStr}-${diaStr}`;
      
      const citasDelDia = citas.filter(c => {
        const fechaLimpia = normalizarFecha(c.fecha);
        return fechaLimpia === fechaStr;
      });

      dias.push({
        vacio: false,
        diaNum: d,
        fechaStr: fechaStr,
        citasDelDia
      });
    }
    return dias;
  };

  const diasCalendario = obtenerDiasDelMes();

  return (
    <div style={estilos.container}>
      {/* Header */}
      <div style={estilos.header}>
        <div>
          <div style={estilos.breadcrumb}>
            <span onClick={onVolver} style={estilos.breadcrumbLink}>Dashboard</span> &gt; <span>Calendario y Agenda</span>
          </div>
          <h1 style={estilos.title}>Calendario y Planificación de Citas</h1>
          <p style={estilos.subtitle}>Visualización mensual y control general de citas registradas en PostgreSQL</p>
        </div>

        <div style={estilos.headerButtons}>
          <button onClick={onIrAProgramar} style={estilos.btnPrimary}>
            + Agendar Cita
          </button>
          <button onClick={onVolver} style={estilos.btnSecondary}>
            ← Volver al Dashboard
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={estilos.toolbar}>
        <div style={estilos.viewToggle}>
          <button 
            onClick={() => setVista('mes')} 
            style={vista === 'mes' ? estilos.toggleBtnActive : estilos.toggleBtn}
          >
            📅 Calendario Mensual
          </button>
          <button 
            onClick={() => setVista('agenda')} 
            style={vista === 'agenda' ? estilos.toggleBtnActive : estilos.toggleBtn}
          >
            📋 Agenda General ({citas.length})
          </button>
        </div>

        {vista === 'mes' && (
          <div style={estilos.navMesBox}>
            <button onClick={() => cambiarMes(-1)} style={estilos.navBtn}>◀ Anterior</button>
            <span style={estilos.mesLabel}>{nombreMes.toUpperCase()}</span>
            <button onClick={() => cambiarMes(1)} style={estilos.navBtn}>Siguiente ▶</button>
          </div>
        )}
      </div>

      {/* VISTA 1: CALENDARIO MENSUAL */}
      {vista === 'mes' && (
        <div style={estilos.calendarCard}>
          <div style={estilos.weekHeaderGrid}>
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => (
              <div key={dia} style={estilos.weekHeaderCell}>{dia}</div>
            ))}
          </div>

          <div style={estilos.calendarGrid}>
            {cargando ? (
              <div style={estilos.loadingState}>Sincronizando eventos con la base de datos...</div>
            ) : (
              diasCalendario.map((item, index) => {
                if (item.vacio) {
                  return <div key={`vacio-${index}`} style={estilos.dayCellEmpty} />;
                }

                const hoyStr = new Date().toISOString().split('T')[0];
                const esHoy = item.fechaStr === hoyStr;

                return (
                  <div key={item.fechaStr} style={esHoy ? estilos.dayCellToday : estilos.dayCell}>
                    <div style={estilos.dayNumberHeader}>
                      <span style={esHoy ? estilos.circleToday : null}>{item.diaNum}</span>
                      {item.citasDelDia.length > 0 && (
                        <span style={estilos.badgeCount}>{item.citasDelDia.length} citas</span>
                      )}
                    </div>
                    
                    <div style={estilos.citasListContainer}>
                      {item.citasDelDia.map(c => (
                        <div key={c.idCita || c.id} style={estilos.citaCardItem} title={`Hora: ${c.hora} - Motivo: ${c.motivo}`}>
                          <div style={estilos.citaTopRow}>
                            <span style={estilos.citaHoraText}>{String(c.hora).substring(0, 5)}</span>
                            <span style={estilos.dotEstado(c.estado)} />
                          </div>
                          <div style={estilos.citaPetText}>🐾 Mascota #{c.idMascota}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VISTA 2: AGENDA GENERAL */}
      {vista === 'agenda' && (
        <div style={estilos.agendaCard}>
          <h3 style={estilos.agendaTitle}>Listado Histórico de Citas en Base de Datos</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={estilos.table}>
              <thead>
                <tr style={estilos.trHead}>
                  <th style={estilos.th}>Fecha</th>
                  <th style={estilos.th}>Hora</th>
                  <th style={estilos.th}>ID Paciente</th>
                  <th style={estilos.th}>Médico ID</th>
                  <th style={estilos.th}>Motivo / Servicio</th>
                  <th style={estilos.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citas.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={estilos.emptyRow}>No hay citas registradas en el sistema.</td>
                  </tr>
                ) : (
                  citas.map(c => (
                    <tr key={c.idCita || c.id} style={estilos.trRow}>
                      <td style={estilos.td}><strong>{normalizarFecha(c.fecha)}</strong></td>
                      <td style={estilos.td}><span style={estilos.badgeHora}>{String(c.hora).substring(0, 5)}</span></td>
                      <td style={estilos.td}>🐾 Mascota #{c.idMascota}</td>
                      <td style={estilos.td}>👨‍⚕️ Veterinario ID #{c.idVeterinario}</td>
                      <td style={estilos.td}>{c.motivo}</td>
                      <td style={estilos.td}>
                        <span style={estilos.badgeEstado(c.estado)}>{c.estado}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const estilos = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px 32px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1e293b',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#ffffff',
    padding: '20px 28px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  breadcrumb: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginBottom: '6px'
  },
  breadcrumbLink: {
    color: '#0284c7',
    cursor: 'pointer',
    fontWeight: 600
  },
  title: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 800,
    color: '#0f2942'
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '0.84rem',
    color: '#64748b'
  },
  headerButtons: {
    display: 'flex',
    gap: '12px'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '0.86rem',
    boxShadow: '0 2px 6px rgba(6, 182, 212, 0.3)'
  },
  btnSecondary: {
    background: '#f1f5f9',
    color: '#334155',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '10px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.86rem'
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  viewToggle: {
    display: 'flex',
    background: '#e2e8f0',
    padding: '4px',
    borderRadius: '10px',
    gap: '4px'
  },
  toggleBtn: {
    background: 'transparent',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.84rem',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer'
  },
  toggleBtnActive: {
    background: '#ffffff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.84rem',
    fontWeight: 700,
    color: '#0284c7',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  navMesBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#ffffff',
    padding: '6px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  navBtn: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#334155'
  },
  mesLabel: {
    fontWeight: 800,
    fontSize: '0.92rem',
    color: '#0f2942',
    letterSpacing: '0.04em'
  },
  calendarCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
  },
  weekHeaderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    background: '#0f2942',
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  weekHeaderCell: {
    padding: '14px 6px'
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    background: '#e2e8f0',
    gap: '1px'
  },
  dayCellEmpty: {
    background: '#f8fafc',
    minHeight: '130px'
  },
  dayCell: {
    background: '#ffffff',
    minHeight: '130px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column'
  },
  dayCellToday: {
    background: '#ecfeff',
    minHeight: '130px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    border: '2px solid #06b6d4'
  },
  dayNumberHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  circleToday: {
    background: '#06b6d4',
    color: '#ffffff',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.8rem'
  },
  badgeCount: {
    background: '#e0f2fe',
    color: '#0284c7',
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '6px'
  },
  citasListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    overflowY: 'auto',
    maxHeight: '90px'
  },
  citaCardItem: {
    background: '#f0fdf4',
    borderLeft: '3px solid #10b981',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.74rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  citaTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  citaHoraText: {
    fontWeight: 800,
    color: '#047857'
  },
  dotEstado: (estado) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: estado === 'Atendida' ? '#10b981' : estado === 'En Sala de Espera' ? '#f59e0b' : '#06b6d4'
  }),
  citaPetText: {
    color: '#334155',
    fontWeight: 600,
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  loadingState: {
    gridColumn: 'span 7',
    padding: '50px',
    textAlign: 'center',
    background: '#ffffff',
    color: '#64748b'
  },
  agendaCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
  },
  agendaTitle: {
    margin: '0 0 16px 0',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#0f2942'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.86rem'
  },
  trHead: {
    background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0'
  },
  th: {
    padding: '12px 16px',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#64748b'
  },
  trRow: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle',
    color: '#334155'
  },
  badgeHora: {
    background: '#e0f2fe',
    color: '#0369a1',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem'
  },
  badgeEstado: (estado) => ({
    background: estado === 'Atendida' ? '#dcfce7' : estado === 'En Sala de Espera' ? '#fef3c7' : '#e0f2fe',
    color: estado === 'Atendida' ? '#166534' : estado === 'En Sala de Espera' ? '#92400e' : '#0369a1',
    padding: '5px 12px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 700
  }),
  emptyRow: {
    textAlign: 'center',
    padding: '30px',
    color: '#94a3b8'
  }
};