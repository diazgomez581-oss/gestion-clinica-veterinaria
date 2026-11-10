
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserRoundCheck,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  X,
  TriangleAlert,
  CircleCheck
} from 'lucide-react';

import { propietariosService } from './propietariosService';
import './ConsultarPropietariosPage.css';

const nombreCompleto = (p) =>
  `${p.nombres || ''} ${p.apellidos || ''}`.trim();

const formatearTelefono = (valor) => {
  const digitos = String(valor || '')
    .replace(/\D/g, '')
    .slice(0, 8);

  return digitos.length > 4
    ? `${digitos.slice(0, 4)}-${digitos.slice(4)}`
    : digitos;
};

export default function ConsultarPropietariosPage({
  onIrARegistro,
  onVolverDashboard
}) {
  const [propietarios, setPropietarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [propietarioEditar, setPropietarioEditar] = useState(null);
  const [formEdicion, setFormEdicion] = useState({
    telefono: '',
    correo: '',
    direccion: ''
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [propietarioEliminar, setPropietarioEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarPropietarios = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const datos = await propietariosService.listarTodos();
      setPropietarios(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los propietarios.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPropietarios();
  }, [cargarPropietarios]);

  const propietariosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return propietarios.filter((p) =>
      [
        nombreCompleto(p),
        p.dui,
        p.telefono,
        p.correo,
        p.direccion
      ].some((valor) =>
        String(valor || '').toLowerCase().includes(texto)
      )
    );
  }, [propietarios, busqueda]);

  const conCorreo = propietarios.filter((p) =>
    Boolean(String(p.correo || '').trim())
  ).length;

  const conTelefono = propietarios.filter((p) =>
    Boolean(String(p.telefono || '').trim())
  ).length;

  const abrirEditar = (p) => {
    setError('');
    setPropietarioEditar(p);
    setFormEdicion({
      telefono: p.telefono || '',
      correo: p.correo || '',
      direccion: p.direccion || ''
    });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (!propietarioEditar) return;

    if (
      formEdicion.telefono.replace(/\D/g, '').length !== 8 ||
      !formEdicion.direccion.trim()
    ) {
      setError('Ingresa un teléfono de 8 dígitos y una dirección.');
      return;
    }

    setGuardandoEdicion(true);
    setError('');

    try {
      await propietariosService.actualizar(
        propietarioEditar.idPropietario,
        {
          nombres: propietarioEditar.nombres,
          apellidos: propietarioEditar.apellidos,
          telefono: formEdicion.telefono.trim(),
          correo: formEdicion.correo.trim() || null,
          direccion: formEdicion.direccion.trim()
        }
      );

      setPropietarioEditar(null);
      setExito(
        `Datos de ${nombreCompleto(propietarioEditar)} actualizados correctamente.`
      );

      await cargarPropietarios();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el propietario.');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!propietarioEliminar) return;

    setEliminando(true);
    setError('');

    try {
      await propietariosService.eliminar(
        propietarioEliminar.idPropietario
      );

      setExito(`Se eliminó a ${nombreCompleto(propietarioEliminar)}.`);
      setPropietarioEliminar(null);
      await cargarPropietarios();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el propietario.');
      setPropietarioEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="gp-page">
      <div className="gp-breadcrumb">
        <button type="button" onClick={onVolverDashboard}>
          Dashboard
        </button>
        <span> › Gestión de Propietarios</span>
      </div>

      <header className="gp-header">
        <div>
          <h1>Gestión de Propietarios</h1>
          <p>Administración de clientes y datos de contacto</p>
        </div>

        <button
          type="button"
          className="gp-btn-primary"
          onClick={onIrARegistro}
        >
          <Plus size={19} />
          Registrar propietario
        </button>
      </header>

      {exito && (
        <div className="gp-alert gp-alert-success" role="status">
          <CircleCheck size={18} />
          {exito}
          <button
            type="button"
            onClick={() => setExito('')}
            aria-label="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="gp-alert gp-alert-error" role="alert">
          <TriangleAlert size={18} />
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Cerrar error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* TARJETAS DE ESTADÍSTICAS */}
      <section
        className="gp-stats"
        aria-label="Estadísticas de propietarios"
      >
        <article className="gp-stat">
          <div className="gp-stat-top">
            <span>Total propietarios</span>
            <Users size={23} />
          </div>
          <strong>{propietarios.length}</strong>
          <small>Clientes registrados</small>
        </article>

        <article className="gp-stat">
          <div className="gp-stat-top">
            <span>Con teléfono</span>
            <UserRoundCheck size={23} />
          </div>
          <strong>{conTelefono}</strong>
          <small>Contactos disponibles</small>
        </article>

        <article className="gp-stat">
          <div className="gp-stat-top">
            <span>Con correo</span>
            <Mail size={23} />
          </div>
          <strong>{conCorreo}</strong>
          <small>Correos registrados</small>
        </article>
      </section>

      {/* LISTADO DE PROPIETARIOS */}
      <section className="gp-panel">
        <div className="gp-panel-head">
          <div>
            <h2>Propietarios registrados</h2>
            <p>Consulta y administra los datos de tus clientes</p>
          </div>

          <button
            type="button"
            className="gp-refresh"
            onClick={cargarPropietarios}
            disabled={cargando}
            title="Actualizar registros"
            aria-label="Actualizar registros"
          >
            <RefreshCw
              size={21}
              className={cargando ? 'gp-spin' : ''}
            />
          </button>
        </div>

        <div className="gp-search">
          <Search size={20} />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, DUI, teléfono o correo..."
            aria-label="Buscar propietarios"
          />
        </div>

        <div className="gp-table-scroll">
          <table className="gp-table">
            <thead>
              <tr>
                <th>Propietario</th>
                <th>DUI</th>
                <th>Teléfono</th>
                <th>Correo electrónico</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className="gp-empty">
                    Cargando propietarios...
                  </td>
                </tr>
              ) : propietariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="gp-empty">
                    {busqueda
                      ? 'No se encontraron coincidencias.'
                      : 'No hay propietarios registrados.'}
                  </td>
                </tr>
              ) : (
                propietariosFiltrados.map((p) => (
                  <tr key={p.idPropietario}>
                    <td>
                      <div className="gp-person">
                        <span className="gp-avatar">
                          <Users size={21} />
                        </span>

                        <span>
                          <strong>{nombreCompleto(p)}</strong>
                          <small>
                            Propietario #{p.idPropietario}
                          </small>
                        </span>
                      </div>
                    </td>

                    <td>{p.dui || '—'}</td>
                    <td>{p.telefono || '—'}</td>

                    <td>
                      {p.correo || (
                        <span className="gp-muted">
                          Sin registrar
                        </span>
                      )}
                    </td>

                    <td
                      className="gp-address"
                      title={p.direccion || ''}
                    >
                      {p.direccion || '—'}
                    </td>

                    <td>
                      <div className="gp-actions">
                        <button
                          type="button"
                          onClick={() => abrirEditar(p)}
                          title="Editar propietario"
                          aria-label={`Editar ${nombreCompleto(p)}`}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          className="gp-delete-action"
                          onClick={() => {
                            setError('');
                            setPropietarioEliminar(p);
                          }}
                          title="Eliminar propietario"
                          aria-label={`Eliminar ${nombreCompleto(p)}`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="gp-footer">
          Mostrando {propietariosFiltrados.length} de{' '}
          {propietarios.length} propietarios
        </div>
      </section>

      {/* MODAL DE EDICIÓN */}
      {propietarioEditar && (
        <div
          className="gp-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !guardandoEdicion
            ) {
              setPropietarioEditar(null);
            }
          }}
        >
          <div
            className="gp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gp-edit-title"
          >
            <div className="gp-modal-title">
              <h2 id="gp-edit-title">Editar propietario</h2>

              <button
                type="button"
                onClick={() => setPropietarioEditar(null)}
                disabled={guardandoEdicion}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarEdicion} className="gp-form">
              <label>
                Nombre completo
                <input
                  value={nombreCompleto(propietarioEditar)}
                  disabled
                />
              </label>

              <label>
                DUI
                <input
                  value={propietarioEditar.dui || ''}
                  disabled
                />
              </label>

              <label>
                Teléfono *
                <input
                  value={formEdicion.telefono}
                  onChange={(e) =>
                    setFormEdicion({
                      ...formEdicion,
                      telefono: formatearTelefono(e.target.value)
                    })
                  }
                  required
                  maxLength={9}
                  inputMode="numeric"
                />
              </label>

              <label>
                Correo electrónico
                <input
                  type="email"
                  value={formEdicion.correo}
                  onChange={(e) =>
                    setFormEdicion({
                      ...formEdicion,
                      correo: e.target.value
                    })
                  }
                />
              </label>

              <label>
                Dirección *
                <textarea
                  rows={3}
                  required
                  value={formEdicion.direccion}
                  onChange={(e) =>
                    setFormEdicion({
                      ...formEdicion,
                      direccion: e.target.value
                    })
                  }
                />
              </label>

              <div className="gp-modal-actions">
                <button
                  type="button"
                  className="gp-btn-secondary"
                  onClick={() => setPropietarioEditar(null)}
                  disabled={guardandoEdicion}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="gp-btn-primary"
                  disabled={guardandoEdicion}
                >
                  {guardandoEdicion
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINACIÓN */}
      {propietarioEliminar && (
        <div
          className="gp-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !eliminando
            ) {
              setPropietarioEliminar(null);
            }
          }}
        >
          <div
            className="gp-modal gp-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="gp-delete-title"
          >
            <span className="gp-warning">
              <TriangleAlert size={29} />
            </span>

            <h2 id="gp-delete-title">
              ¿Eliminar propietario?
            </h2>

            <p>
              ¿Deseas eliminar a{' '}
              <strong>
                {nombreCompleto(propietarioEliminar)}
              </strong>
              ? Esta acción no se puede deshacer.
            </p>

            <div className="gp-modal-actions">
              <button
                type="button"
                className="gp-btn-secondary"
                onClick={() => setPropietarioEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="gp-btn-danger"
                onClick={confirmarEliminar}
                disabled={eliminando}
              >
                {eliminando
                  ? 'Eliminando...'
                  : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
