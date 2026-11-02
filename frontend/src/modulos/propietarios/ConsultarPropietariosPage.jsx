import React, { useState, useEffect } from 'react';
import { propietariosService } from './propietariosService';

export default function ConsultarPropietariosPage({ onIrARegistro, onVolverDashboard }) {
  const [propietarios, setPropietarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Estado para el modal de edición
  const [propietarioEditar, setPropietarioEditar] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    telefono: '',
    correo: '',
    direccion: ''
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Estado para el modal de eliminación nativo
  const [propietarioEliminar, setPropietarioEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Formateador automático de Teléfono (####-####)
  const formatearTelefono = (valor) => {
    const soloNumeros = valor.replace(/\D/g, '').slice(0, 8);
    if (soloNumeros.length > 4) {
      return `${soloNumeros.slice(0, 4)}-${soloNumeros.slice(4)}`;
    }
    return soloNumeros;
  };

  const cargarPropietarios = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await propietariosService.listarTodos();
      setPropietarios(data || []);
    } catch (err) {
      setError(err.message || 'Error al conectar con la base de datos PostgreSQL.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPropietarios();
  }, []);

  // Filtro dinámico en vivo
  const propietariosFiltrados = propietarios.filter((p) => {
    const texto = busqueda.toLowerCase().trim();
    const nombreCompleto = `${p.nombres || ''} ${p.apellidos || ''}`.toLowerCase();
    const dui = (p.dui || '').toLowerCase();
    const tel = (p.telefono || '').toLowerCase();
    return nombreCompleto.includes(texto) || dui.includes(texto) || tel.includes(texto);
  });

  // Abrir Modal de Edición
  const handleAbrirEditar = (propietario) => {
    setPropietarioEditar(propietario);
    setFormEdicion({
      telefono: propietario.telefono || '',
      correo: propietario.correo || '',
      direccion: propietario.direccion || ''
    });
    setError('');
  };

  const handleCerrarEditar = () => {
    setPropietarioEditar(null);
    setFormEdicion({ telefono: '', correo: '', direccion: '' });
  };

  // Guardar Cambios de Edición (PUT)
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!formEdicion.telefono.trim() || !formEdicion.direccion.trim()) {
      setError('El teléfono y la dirección son obligatorios.');
      return;
    }

    try {
      setGuardandoEdicion(true);
      setError('');

      const payload = {
        nombres: propietarioEditar.nombres,
        apellidos: propietarioEditar.apellidos,
        telefono: formEdicion.telefono.trim(),
        correo: formEdicion.correo.trim() || null,
        direccion: formEdicion.direccion.trim()
      };

      await propietariosService.actualizar(propietarioEditar.idPropietario, payload);
      setExito(`Se actualizaron los datos de ${propietarioEditar.nombres} ${propietarioEditar.apellidos} correctamente.`);
      handleCerrarEditar();
      cargarPropietarios();

      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar el propietario.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Abrir Modal de Eliminación
  const handleAbrirEliminar = (propietario) => {
    setPropietarioEliminar(propietario);
    setError('');
  };

  // Confirmar la Eliminación
  const handleConfirmarEliminar = async () => {
    if (!propietarioEliminar) return;

    try {
      setEliminando(true);
      setError('');

      if (propietariosService.eliminar) {
        await propietariosService.eliminar(propietarioEliminar.idPropietario);
        setExito(`El propietario ${propietarioEliminar.nombres} ${propietarioEliminar.apellidos} fue eliminado.`);
        setPropietarioEliminar(null);
        cargarPropietarios();
        setTimeout(() => setExito(''), 3000);
      } else {
        setError('La función de eliminación no está habilitada en el backend.');
        setPropietarioEliminar(null);
      }
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el registro.');
      setPropietarioEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div style={estilos.container}>
      {/* Header de Navegación */}
      <div style={estilos.header}>
        <div>
          <div style={estilos.breadcrumb}>
            <span onClick={onVolverDashboard} style={estilos.breadcrumbLink}>Dashboard</span> &gt; <span>Gestión de Propietarios</span>
          </div>
          <h1 style={estilos.title}>Directorio de Propietarios</h1>
        </div>

        <div style={estilos.headerButtons}>
          <button onClick={onIrARegistro} style={estilos.btnPrimary}>
            + Registrar Propietario
          </button>
          <button onClick={onVolverDashboard} style={estilos.btnSecondary}>
            ← Volver al Dashboard
          </button>
        </div>
      </div>

      {/* Banners de Notificación */}
      {exito && <div style={estilos.alertSuccess}>✓ {exito}</div>}
      {error && <div style={estilos.alertDanger}>⚠️ {error}</div>}

      {/* Tarjeta de Tabla y Buscador */}
      <div style={estilos.card}>
        <div style={estilos.toolbar}>
          <div style={{ flex: 1, maxWidth: '420px' }}>
            <input
              type="text"
              placeholder="Buscar por nombre, DUI o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={estilos.inputSearch}
            />
          </div>
          <button onClick={cargarPropietarios} style={estilos.btnRefresh}>
            🔄 Refrescar
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={estilos.table}>
            <thead>
              <tr style={estilos.trHead}>
                <th style={estilos.th}>ID</th>
                <th style={estilos.th}>Nombre Completo</th>
                <th style={estilos.th}>DUI</th>
                <th style={estilos.th}>Teléfono</th>
                <th style={estilos.th}>Correo Electrónico</th>
                <th style={estilos.th}>Dirección</th>
                <th style={{ ...estilos.th, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="7" style={estilos.emptyRow}>Cargando registros desde PostgreSQL...</td>
                </tr>
              ) : propietariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={estilos.emptyRow}>
                    {busqueda ? 'No se encontraron propietarios que coincidan con la búsqueda.' : 'No hay propietarios registrados todavía.'}
                  </td>
                </tr>
              ) : (
                propietariosFiltrados.map((p) => (
                  <tr key={p.idPropietario} style={estilos.trRow}>
                    <td style={estilos.td}><strong>#{p.idPropietario}</strong></td>
                    <td style={estilos.td}>
                      <strong>{p.nombres} {p.apellidos}</strong>
                    </td>
                    <td style={estilos.td}>
                      <span style={estilos.badgeDui}>{p.dui}</span>
                    </td>
                    <td style={estilos.td}>{p.telefono}</td>
                    <td style={estilos.td}>{p.correo || <span style={{ color: '#94a3b8' }}>Sin registrar</span>}</td>
                    <td style={estilos.td}>{p.direccion}</td>
                    <td style={{ ...estilos.td, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleAbrirEditar(p)} style={estilos.btnActionEdit} title="Editar datos">
                          ✏️ Editar
                        </button>
                        <button onClick={() => handleAbrirEliminar(p)} style={estilos.btnActionDelete} title="Eliminar registro">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDICIÓN */}
      {propietarioEditar && (
        <div style={estilos.modalOverlay}>
          <div style={estilos.modalCard}>
            <div style={estilos.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f2942' }}>
                Editar Propietario #{propietarioEditar.idPropietario}
              </h3>
              <button onClick={handleCerrarEditar} style={estilos.btnCloseModal}>✕</button>
            </div>

            <form onSubmit={handleGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={estilos.labelDisabled}>Nombre Completo (Inmutable)</label>
                <input
                  type="text"
                  value={`${propietarioEditar.nombres} ${propietarioEditar.apellidos}`}
                  disabled
                  style={estilos.inputDisabled}
                />
              </div>

              <div>
                <label style={estilos.labelDisabled}>DUI (Clave Única Inmutable)</label>
                <input
                  type="text"
                  value={propietarioEditar.dui}
                  disabled
                  style={estilos.inputDisabled}
                />
              </div>

              <div>
                <label style={estilos.labelForm}>Teléfono de Contacto *</label>
                <input
                  type="text"
                  value={formEdicion.telefono}
                  onChange={(e) => setFormEdicion({ ...formEdicion, telefono: formatearTelefono(e.target.value) })}
                  maxLength="9"
                  required
                  style={estilos.inputForm}
                />
              </div>

              <div>
                <label style={estilos.labelForm}>Correo Electrónico</label>
                <input
                  type="email"
                  value={formEdicion.correo}
                  onChange={(e) => setFormEdicion({ ...formEdicion, correo: e.target.value })}
                  style={estilos.inputForm}
                />
              </div>

              <div>
                <label style={estilos.labelForm}>Dirección de Residencia *</label>
                <textarea
                  rows="3"
                  value={formEdicion.direccion}
                  onChange={(e) => setFormEdicion({ ...formEdicion, direccion: e.target.value })}
                  required
                  style={{ ...estilos.inputForm, fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={handleCerrarEditar} style={estilos.btnSecondary} disabled={guardandoEdicion}>
                  Cancelar
                </button>
                <button type="submit" style={estilos.btnPrimary} disabled={guardandoEdicion}>
                  {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {propietarioEliminar && (
        <div style={estilos.modalOverlay}>
          <div style={{ ...estilos.modalCard, maxWidth: '440px', textAlign: 'center', padding: '28px 24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              margin: '0 auto 16px auto',
              border: '1px solid #fecaca'
            }}>
              ⚠️
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f2942' }}>
              ¿Eliminar Propietario?
            </h3>

            <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: '#64748b', lineHeight: '1.4' }}>
              ¿Estás seguro de que deseas eliminar a <strong>{propietarioEliminar.nombres} {propietarioEliminar.apellidos}</strong> (DUI: {propietarioEliminar.dui})? Esta acción removerá el registro de la base de datos.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                onClick={() => setPropietarioEliminar(null)} 
                style={{ ...estilos.btnSecondary, flex: 1 }}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmarEliminar} 
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                  flex: 1
                }}
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
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
    minHeight: '100vh',
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  breadcrumb: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginBottom: '6px',
  },
  breadcrumbLink: {
    color: '#0284c7',
    cursor: 'pointer',
    fontWeight: 600,
  },
  title: {
    margin: 0,
    fontSize: '1.45rem',
    fontWeight: 800,
    color: '#0f2942',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
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
    boxShadow: '0 2px 6px rgba(6, 182, 212, 0.3)',
  },
  btnSecondary: {
    background: '#f1f5f9',
    color: '#334155',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '10px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.86rem',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '12px',
  },
  inputSearch: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    outline: 'none',
  },
  btnRefresh: {
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    padding: '9px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.84rem',
    color: '#334155',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.86rem',
  },
  trHead: {
    background: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  },
  th: {
    padding: '12px 16px',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#64748b',
  },
  trRow: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle',
    color: '#334155',
  },
  badgeDui: {
    background: '#e0f2fe',
    color: '#0369a1',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem',
  },
  btnActionEdit: {
    background: '#f0f9ff',
    color: '#0284c7',
    border: '1px solid #bae6fd',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.78rem',
  },
  btnActionDelete: {
    background: '#fef2f2',
    color: '#ef4444',
    border: '1px solid #fecaca',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.78rem',
  },
  emptyRow: {
    textAlign: 'center',
    padding: '30px',
    color: '#94a3b8',
  },
  alertSuccess: {
    background: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  alertDanger: {
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    background: '#ffffff',
    width: '100%',
    maxWidth: '520px',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px',
  },
  btnCloseModal: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#64748b',
  },
  labelForm: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '4px',
    display: 'block',
  },
  labelDisabled: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '4px',
    display: 'block',
  },
  inputForm: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.86rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inputDisabled: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '0.86rem',
    boxSizing: 'border-box',
  },
};