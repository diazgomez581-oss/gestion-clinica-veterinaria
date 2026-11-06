
import React, { useCallback, useEffect, useState } from 'react';
import './GestionUsuariosPage.css';
import { AlertTriangle, ArrowLeft, CheckCircle2, Plus, Stethoscope, User, X } from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const roles = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  VETERINARIO: 'Veterinario/a'
};

const formularioInicial = {
  nombre: '',
  username: '',
  password: '',
  rol: 'RECEPCIONISTA'
};

export default function GestionUsuariosPage({ onVolver }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar los usuarios.');
      }

      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const actualizarCampo = (campo, valor) => {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const registrarUsuario = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        nombre: formulario.nombre.trim(),
        username: formulario.username.trim(),
        password: formulario.password,
        rol: formulario.rol
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'No se pudo registrar el usuario.');
      }

      setMensaje('Usuario registrado correctamente.');
      setFormulario(formularioInicial);
      setMostrarFormulario(false);
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (usuario) => {
    const nuevoEstado = !usuario.activo;

    if (!window.confirm(
      `¿Deseás ${nuevoEstado ? 'activar' : 'desactivar'} a ${usuario.nombre}?`
    )) {
      return;
    }

    setError('');
    setMensaje('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/usuarios/${usuario.idUsuario}/estado`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            activo: nuevoEstado
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'No se pudo actualizar el estado.');
      }

      setMensaje('Estado actualizado correctamente.');
      await cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(usuario =>
    `${usuario.nombre} ${usuario.username} ${usuario.rol}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="gcv-usuarios-page">

      <div className="gcv-usuarios-header">
        <div>
          <span className="gcv-usuarios-breadcrumb">
            Administración / Usuarios
          </span>
          <h1>Gestión de usuarios</h1>
          <p>Administrá las cuentas y el acceso del personal de la clínica.</p>
        </div>

        <div className="gcv-usuarios-header-actions">
          <button
            className="gcv-usuarios-btn-secondary"
            onClick={onVolver}
          >
            <ArrowLeft size={16} /> Volver
          </button>

          <button
            className="gcv-usuarios-btn-primary"
            onClick={() => {
              setError('');
              setMensaje('');
              setMostrarFormulario(true);
            }}
          >
            <Plus size={16} /> Nuevo usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="gcv-usuarios-alert error" role="alert">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {mensaje && (
        <div className="gcv-usuarios-alert success" role="status">
          <CheckCircle2 size={18} /> {mensaje}
        </div>
      )}

      <div className="gcv-usuarios-stats">
        <div className="gcv-usuarios-stat">
          <span>Total de usuarios</span>
          <strong>{usuarios.length}</strong>
          <small>Registrados en el sistema</small>
        </div>

        <div className="gcv-usuarios-stat">
          <span>Usuarios activos</span>
          <strong>{usuarios.filter(u => u.activo).length}</strong>
          <small>Con acceso habilitado</small>
        </div>

        <div className="gcv-usuarios-stat">
          <span>Usuarios inactivos</span>
          <strong>{usuarios.filter(u => !u.activo).length}</strong>
          <small>Acceso deshabilitado</small>
        </div>
      </div>

      <section className="gcv-usuarios-panel">
        <div className="gcv-usuarios-panel-header">
          <div>
            <h2>Personal registrado</h2>
            <p>Listado de cuentas del sistema veterinario</p>
          </div>

          <input
            type="search"
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <div className="gcv-usuarios-table-wrapper">
          <table className="gcv-usuarios-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="5" className="gcv-usuarios-empty">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="gcv-usuarios-empty">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map(usuario => (
                  <tr key={usuario.idUsuario}>
                    <td>
                      <div className="gcv-usuarios-persona">
                        <span className="gcv-usuarios-avatar"><User size={17} /></span>
                        <strong>{usuario.nombre}</strong>
                      </div>
                    </td>

                    <td>{usuario.username}</td>

                    <td>
                      <span className="gcv-usuarios-rol">
                        {roles[usuario.rol] || usuario.rol}
                      </span>
                    </td>

                    <td>
                      <span className={
                        `gcv-usuarios-estado ${
                          usuario.activo ? 'activo' : 'inactivo'
                        }`
                      }>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td>
                      <button
                        className="gcv-usuarios-btn-action"
                        onClick={() => cambiarEstado(usuario)}
                      >
                        {usuario.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {mostrarFormulario && (
        <div
          className="gcv-usuarios-modal-overlay"
          onClick={() => !guardando && setMostrarFormulario(false)}
        >
          <section
            className="gcv-usuarios-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gcv-nuevo-usuario-titulo"
            onClick={e => e.stopPropagation()}
          >
            <div className="gcv-usuarios-modal-header">
              <div>
                <h2 id="gcv-nuevo-usuario-titulo">Registrar usuario</h2>
                <p>Creá una cuenta para un trabajador de la clínica.</p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                disabled={guardando}
                aria-label="Cerrar formulario"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={registrarUsuario}>
              <label htmlFor="nuevo-nombre">Nombre completo</label>
              <input
                id="nuevo-nombre"
                value={formulario.nombre}
                onChange={e => actualizarCampo('nombre', e.target.value)}
                placeholder="Ej. María Rodríguez"
                required
              />

              <label htmlFor="nuevo-username">Nombre de usuario</label>
              <input
                id="nuevo-username"
                value={formulario.username}
                onChange={e => actualizarCampo('username', e.target.value)}
                placeholder="Ej. maria.rodriguez"
                required
              />

              <label htmlFor="nuevo-password">Contraseña inicial</label>
              <input
                id="nuevo-password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={formulario.password}
                onChange={e => actualizarCampo('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />

              <label htmlFor="nuevo-rol">Rol del trabajador</label>
              <select
                id="nuevo-rol"
                value={formulario.rol}
                onChange={e => actualizarCampo('rol', e.target.value)}
              >
                <option value="RECEPCIONISTA">Recepcionista</option>
                <option value="VETERINARIO">Veterinario/a</option>
                <option value="ADMIN">Administrador</option>
              </select>

              {formulario.rol === 'VETERINARIO' && (
                <p className="gcv-usuarios-info">
                    <Stethoscope size={17} /> Este trabajador se registrará automáticamente
                    como veterinario y podrá ser asignado a las
                    consultas y citas de la clínica.
                </p>
                )}

              <div className="gcv-usuarios-modal-actions">
                <button
                  type="button"
                  className="gcv-usuarios-btn-secondary"
                  onClick={() => setMostrarFormulario(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="gcv-usuarios-btn-primary"
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar usuario'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
