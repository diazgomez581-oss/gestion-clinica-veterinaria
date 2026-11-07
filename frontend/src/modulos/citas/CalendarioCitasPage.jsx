import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, ClipboardList, PawPrint, Plus, Stethoscope } from 'lucide-react';
import { citasService } from './citasService';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// No usar toISOString(): puede cambiar de día según la zona horaria.
const fechaLocal = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

const normalizarFecha = (fechaInput) => {
  if (!fechaInput) return '';
  if (Array.isArray(fechaInput)) {
    const [y, m, d] = fechaInput;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(fechaInput).substring(0, 10);
};

const inicioDeSemana = (fecha) => {
  const resultado = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const desplazamiento = (resultado.getDay() + 6) % 7; // Lunes = 0
  resultado.setDate(resultado.getDate() - desplazamiento);
  return resultado;
};

const etiquetaDia = (fecha) =>
  fecha.toLocaleDateString('es-SV', { day: 'numeric', month: 'long' });

const horaCita = (hora) => String(hora || '').substring(0, 5) || '—';

const coloresEstado = (estado) => {
  if (estado === 'Atendida') return { fondo: '#dcfce7', texto: '#166534', borde: '#16a34a' };
  if (estado === 'En Sala de Espera' || estado === 'En espera') return { fondo: '#fef3c7', texto: '#92400e', borde: '#f59e0b' };
  if (estado === 'En Consulta') return { fondo: '#dbeafe', texto: '#1d4ed8', borde: '#2563eb' };
  if (estado === 'Cancelada') return { fondo: '#fee2e2', texto: '#b91c1c', borde: '#ef4444' };
  if (estado === 'No Asistió') return { fondo: '#fff7ed', texto: '#9a3412', borde: '#ea580c' };
  return { fondo: '#e0f2fe', texto: '#0369a1', borde: '#06b6d4' };
};

export default function CalendarioCitasPage({ onVolver, onIrAProgramar }) {
  const [vista, setVista] = useState('mes'); // 'mes' | 'agenda'
  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [fechaActual, setFechaActual] = useState(() => new Date());

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        setCargando(true);
        const [listaCitas, listaMascotas, listaVets] = await Promise.all([
          citasService.getTodasLasCitas(),
          citasService.getMascotas(),
          citasService.getVeterinarios()
        ]);
        if (!activo) return;
        setCitas(Array.isArray(listaCitas) ? listaCitas : []);
        setMascotas(Array.isArray(listaMascotas) ? listaMascotas : []);
        setVeterinarios(Array.isArray(listaVets) ? listaVets : []);
        setError('');
      } catch (err) {
        if (activo) setError(err?.message || 'No se pudieron cargar los datos del calendario.');
      } finally {
        if (activo) setCargando(false);
      }
    };
    cargar();
    return () => { activo = false; };
  }, []);

  const mascotasPorId = useMemo(
    () => new Map(mascotas.map(m => [String(m.idMascota), m])),
    [mascotas]
  );
  const vetsPorId = useMemo(
    () => new Map(veterinarios.map(v => [String(v.idVeterinario), v])),
    [veterinarios]
  );

  const nombreMascota = (cita) =>
    cita.nombreMascota || mascotasPorId.get(String(cita.idMascota))?.nombre || `Mascota #${cita.idMascota}`;

  const nombreVeterinario = (cita) => {
    const vet = vetsPorId.get(String(cita.idVeterinario));
    return cita.nombreVeterinario || cita.veterinarioNombre || vet?.nombre ||
      (vet ? `${vet.nombres || ''} ${vet.apellidos || ''}`.trim() : '') ||
      `Veterinario #${cita.idVeterinario}`;
  };

  const citasPorFecha = useMemo(() => {
    const agrupadas = new Map();
    citas.forEach(cita => {
      const fecha = normalizarFecha(cita.fecha);
      if (!fecha) return;
      if (!agrupadas.has(fecha)) agrupadas.set(fecha, []);
      agrupadas.get(fecha).push(cita);
    });
    agrupadas.forEach(lista => lista.sort((a, b) => horaCita(a.hora).localeCompare(horaCita(b.hora))));
    return agrupadas;
  }, [citas]);

  const cambiarPeriodo = (direccion) => {
    setFechaActual(anterior => {
      if (vista === 'mes') {
        // Día 1 evita saltos inesperados al navegar desde el 29, 30 o 31.
        return new Date(anterior.getFullYear(), anterior.getMonth() + direccion, 1);
      }
      const lunes = inicioDeSemana(anterior);
      lunes.setDate(lunes.getDate() + 7 * direccion);
      return lunes;
    });
  };

  const anio = fechaActual.getFullYear();
  const mesIndex = fechaActual.getMonth();
  const nombreMes = fechaActual.toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });

  const diasCalendario = useMemo(() => {
    const primero = new Date(anio, mesIndex, 1);
    const total = new Date(anio, mesIndex + 1, 0).getDate();
    const vacios = (primero.getDay() + 6) % 7;
    const resultado = Array.from({ length: vacios }, () => ({ vacio: true }));
    for (let dia = 1; dia <= total; dia++) {
      const fechaStr = fechaLocal(new Date(anio, mesIndex, dia));
      resultado.push({ vacio: false, diaNum: dia, fechaStr, citasDelDia: citasPorFecha.get(fechaStr) || [] });
    }
    return resultado;
  }, [anio, mesIndex, citasPorFecha]);

  const semana = useMemo(() => {
    const lunes = inicioDeSemana(fechaActual);
    return Array.from({ length: 7 }, (_, indice) => {
      const fecha = new Date(lunes);
      fecha.setDate(fecha.getDate() + indice);
      const fechaStr = fechaLocal(fecha);
      return { fecha, fechaStr, citasDelDia: citasPorFecha.get(fechaStr) || [] };
    });
  }, [fechaActual, citasPorFecha]);

  const tituloSemana = `${etiquetaDia(semana[0].fecha)} – ${etiquetaDia(semana[6].fecha)} de ${semana[6].fecha.getFullYear()}`;
  const hoy = fechaLocal(new Date());

  return (
    <div style={estilos.container}>
      <div style={estilos.header}>
        <div>
          <div style={estilos.breadcrumb}>
            <span onClick={onVolver} style={estilos.breadcrumbLink}>Dashboard</span> &gt; <span>Calendario y Agenda</span>
          </div>
          <h1 style={estilos.title}>Calendario y Planificación de Citas</h1>
          <p style={estilos.subtitle}>Visualización mensual y control general de citas registradas en PostgreSQL</p>
        </div>
        <div style={estilos.headerButtons}>
          <button type="button" onClick={onIrAProgramar} style={estilos.btnPrimary}><Plus size="1em" className="icono-texto" /> Agendar Cita</button>
          <button type="button" onClick={onVolver} style={estilos.btnSecondary}><ArrowLeft size="1em" className="icono-texto" /> Volver al Dashboard</button>
        </div>
      </div>

      <div style={estilos.toolbar}>
        <div style={estilos.viewToggle}>
          <button type="button" onClick={() => setVista('mes')} style={vista === 'mes' ? estilos.toggleBtnActive : estilos.toggleBtn}><Calendar size="1em" className="icono-texto" /> Calendario Mensual</button>
          <button type="button" onClick={() => setVista('agenda')} style={vista === 'agenda' ? estilos.toggleBtnActive : estilos.toggleBtn}><ClipboardList size="1em" className="icono-texto" /> Agenda Semanal ({citas.length})</button>
        </div>
        <div style={estilos.navMesBox}>
          <button type="button" onClick={() => cambiarPeriodo(-1)} style={estilos.navBtn}><ChevronLeft size="1em" className="icono-texto" /> Anterior</button>
          <button type="button" onClick={() => setFechaActual(new Date())} style={estilos.navBtn}>Hoy</button>
          <span style={estilos.mesLabel}>{vista === 'mes' ? nombreMes.toUpperCase() : tituloSemana}</span>
          <button type="button" onClick={() => cambiarPeriodo(1)} style={estilos.navBtn}>Siguiente <ChevronRight size="1em" className="icono-texto" /></button>
        </div>
      </div>
      {error && <div style={{ ...estilos.agendaCard, marginBottom: '14px', color: '#b91c1c' }}>{error}</div>}

      {vista === 'mes' && (
        <div style={estilos.calendarCard}>
          <div style={estilos.weekHeaderGrid}>
            {DIAS_SEMANA.map(dia => <div key={dia} style={estilos.weekHeaderCell}>{dia}</div>)}
          </div>
          <div style={estilos.calendarGrid}>
            {cargando ? (
              <div style={estilos.loadingState}>Sincronizando eventos con la base de datos...</div>
            ) : diasCalendario.map((item, index) => item.vacio ? (
              <div key={`vacio-${index}`} style={estilos.dayCellEmpty} />
            ) : (
              <div key={item.fechaStr} style={item.fechaStr === hoy ? estilos.dayCellToday : estilos.dayCell}>
                <div style={estilos.dayNumberHeader}>
                  <span style={item.fechaStr === hoy ? estilos.circleToday : undefined}>{item.diaNum}</span>
                  {item.citasDelDia.length > 0 && <span style={estilos.badgeCount}>{item.citasDelDia.length} citas</span>}
                </div>
                <div style={estilos.citasListContainer}>
                  {item.citasDelDia.map(cita => (
                    <div key={cita.idCita || cita.id} style={{ ...estilos.citaCardItem, borderLeftColor: coloresEstado(cita.estado).borde, background: coloresEstado(cita.estado).fondo }} title={`${nombreMascota(cita)} · ${nombreVeterinario(cita)} · ${cita.motivo || ''}`}>
                      <div style={estilos.citaTopRow}>
                        <span style={estilos.citaHoraText}>{horaCita(cita.hora)}</span>
                        <span style={{ ...estilos.dotEstado(cita.estado), background: coloresEstado(cita.estado).borde }} />
                      </div>
                      <div style={estilos.citaPetText}><PawPrint size="1em" className="icono-texto" /> {nombreMascota(cita)}</div>
                      <div style={{ ...estilos.citaPetText, fontSize: '0.68rem', fontWeight: 400 }}><Stethoscope size="1em" className="icono-texto" /> {nombreVeterinario(cita)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vista === 'agenda' && (
        <div style={estilos.agendaCard}>
          <div style={{ ...estilos.agendaTitle, marginBottom: '6px' }}>Agenda semanal · {tituloSemana}</div>
          <p style={{ ...estilos.subtitle, marginBottom: '18px' }}>Citas agrupadas de lunes a domingo y ordenadas por hora.</p>
          {cargando ? <div style={estilos.emptyRow}>Cargando citas desde PostgreSQL...</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {semana.map((dia, index) => (
                <section key={dia.fechaStr} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ background: dia.fechaStr === hoy ? '#ecfeff' : '#f1f5f9', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <strong style={{ color: '#0f2942', fontSize: '0.85rem' }}>{DIAS_SEMANA[index]} · {etiquetaDia(dia.fecha)}</strong>
                    <span style={estilos.badgeCount}>{dia.citasDelDia.length} {dia.citasDelDia.length === 1 ? 'cita' : 'citas'}</span>
                  </div>
                  {dia.citasDelDia.length === 0 ? (
                    <div style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>Sin citas registradas para este día.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={estilos.table}>
                        <thead>
                          <tr style={estilos.trHead}>
                            <th style={estilos.th}>Hora</th>
                            <th style={estilos.th}>Mascota</th>
                            <th style={estilos.th}>Veterinario</th>
                            <th style={estilos.th}>Motivo</th>
                            <th style={estilos.th}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dia.citasDelDia.map(cita => (
                            <tr key={cita.idCita || cita.id} style={estilos.trRow}>
                              <td style={estilos.td}><span style={estilos.badgeHora}>{horaCita(cita.hora)}</span></td>
                              <td style={{ ...estilos.td, fontWeight: 600 }}>{nombreMascota(cita)}</td>
                              <td style={estilos.td}>{nombreVeterinario(cita)}</td>
                              <td style={estilos.td}>{cita.motivo || '—'}</td>
                              <td style={estilos.td}><span style={{ ...estilos.badgeEstado(cita.estado), background: coloresEstado(cita.estado).fondo, color: coloresEstado(cita.estado).texto }}>{cita.estado || 'Sin estado'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
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