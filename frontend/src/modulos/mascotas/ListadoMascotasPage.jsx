
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PawPrint,
  Dog,
  Cat,
  Plus,
  Search,
  Eye,
  RefreshCw,
  AlertCircle
} from "lucide-react";

import { obtenerMascotas } from "./mascotasService";

import "./ListadoMascotasPage.css";

// ============================================
// FUNCIONES AUXILIARES
// ============================================

const normalizarLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  if (Array.isArray(respuesta?.results)) return respuesta.results;
  if (Array.isArray(respuesta?._embedded?.propietarios)) {
    return respuesta._embedded.propietarios;
  }
  if (Array.isArray(respuesta?._embedded?.mascotas)) {
    return respuesta._embedded.mascotas;
  }
  return [];
};

// El backend expone nombrePropietario desde Mascota.java.
// Se admite además un objeto anidado por compatibilidad.
const obtenerPropietario = (mascota) => {
  const nombre = mascota.nombrePropietario ?? mascota.nombre_propietario;
  if (typeof nombre === "string" && nombre.trim()) return nombre.trim();

  const p = mascota.propietario;
  if (p && typeof p === "object") {
    const completo = p.nombreCompleto ?? p.nombre_completo;
    if (typeof completo === "string" && completo.trim()) return completo.trim();
    const compuesto = [p.nombres ?? p.nombre, p.apellidos ?? p.apellido]
      .filter(Boolean).join(" ").trim();
    if (compuesto) return compuesto;
  }
  return "Propietario no disponible";
};

const obtenerExpediente = (mascota) => {
  return (
    mascota.codigoExpediente ??
    mascota.codigo_expediente ??
    "Pendiente"
  );
};

const obtenerIdMascota = (mascota) => {
  return (
    mascota.idMascota ??
    mascota.id_mascota ??
    mascota.id ??
    mascota.codigoExpediente ??
    mascota.codigo_expediente
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ListadoMascotasPage({
  onAgregarMascota,
  onVerExpediente
}) {
  const [mascotas, setMascotas] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState("");

  // ============================================
  // CARGAR MASCOTAS
  // ============================================

  const cargarMascotas = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const respuesta = await obtenerMascotas();
      const lista = normalizarLista(respuesta);

      setMascotas(lista);

    } catch (err) {
      console.error("Error al cargar mascotas:", err);

      setError(
        "No se pudieron cargar las mascotas. Verifica el servidor."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarMascotas();
  }, [cargarMascotas]);

  // ============================================
  // BUSCADOR
  // ============================================

  const mascotasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return mascotas;

    return mascotas.filter((mascota) => {
      const campos = [
        mascota.nombre,
        mascota.especie,
        mascota.raza,
        obtenerExpediente(mascota),
        obtenerPropietario(mascota)
      ];

      return campos.some((campo) =>
        String(campo ?? "")
          .toLowerCase()
          .includes(texto)
      );
    });
  }, [mascotas, busqueda]);

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  const totalCaninos = useMemo(() => {
    return mascotas.filter((mascota) =>
      ["canino", "perro"].includes(
        String(mascota.especie || "")
          .trim()
          .toLowerCase()
      )
    ).length;
  }, [mascotas]);

  const totalFelinos = useMemo(() => {
    return mascotas.filter((mascota) =>
      ["felino", "gato"].includes(
        String(mascota.especie || "")
          .trim()
          .toLowerCase()
      )
    ).length;
  }, [mascotas]);

  const actualizarListado = () => {
    cargarMascotas();
  };

  // ============================================
  // INTERFAZ
  // ============================================

  return (
    <div className="lm-page">

      {/* ENCABEZADO */}
      <div className="lm-header">
        <div>
          <div className="lm-breadcrumb">
            Dashboard › Gestión de Mascotas
          </div>

          <h1>Gestión de Mascotas</h1>

          <p>
            Administración de pacientes y expedientes clínicos
          </p>
        </div>

        <button
          type="button"
          className="lm-btn-primary"
          onClick={onAgregarMascota}
        >
          <Plus size={18} />
          Agregar mascota
        </button>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="lm-stats">

        <div className="lm-stat-card">
          <div className="lm-stat-top">
            <span>Total mascotas</span>
            <PawPrint size={22} />
          </div>

          <strong>{mascotas.length}</strong>
          <small>Pacientes registrados</small>
        </div>

        <div className="lm-stat-card">
          <div className="lm-stat-top">
            <span>Caninos</span>
            <Dog size={22} />
          </div>

          <strong>{totalCaninos}</strong>
          <small>Pacientes registrados</small>
        </div>

        <div className="lm-stat-card">
          <div className="lm-stat-top">
            <span>Felinos</span>
            <Cat size={22} />
          </div>

          <strong>{totalFelinos}</strong>
          <small>Pacientes registrados</small>
        </div>

      </div>

      {/* LISTADO */}
      <section className="lm-panel">

        <div className="lm-panel-header">
          <div>
            <h2>Pacientes registrados</h2>

            <p>
              Consulta y administra los expedientes
            </p>
          </div>

          <button
            type="button"
            className="lm-refresh"
            onClick={actualizarListado}
            title="Actualizar listado"
            aria-label="Actualizar listado"
            disabled={cargando}
          >
            <RefreshCw size={19} />
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="lm-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Buscar por nombre, expediente o propietario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* ERRORES */}
        {error && (
          <div className="lm-error">
            <AlertCircle size={18} />
            <span>{error}</span>

            <button
              type="button"
              onClick={cargarMascotas}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* TABLA */}
        <div className="lm-table-container">
          <table className="lm-table">

            <thead>
              <tr>
                <th>Paciente</th>
                <th>Especie</th>
                <th>Propietario</th>
                <th>Expediente</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {!cargando &&
                mascotasFiltradas.map((m) => (
                  <tr key={obtenerIdMascota(m)}>

                    <td>
                      <div className="lm-paciente">
                        <div className="lm-avatar">
                          <PawPrint size={18} />
                        </div>

                        <div>
                          <strong>{m.nombre}</strong>

                          <small>
                            {m.raza || "Sin raza"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>{m.especie || "—"}</td>

                    <td>
                      {obtenerPropietario(m)}
                    </td>

                    <td>
                      <span className="lm-expediente">
                        {obtenerExpediente(m)}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="lm-action"
                        title="Ver expediente"
                        aria-label={`Ver expediente de ${m.nombre}`}
                        disabled={!onVerExpediente}
                        onClick={() => onVerExpediente?.(m)}
                      >
                        <Eye size={18} />
                      </button>
                    </td>

                  </tr>
                ))}
            </tbody>
          </table>

          {/* CARGANDO MASCOTAS */}
          {cargando && (
            <div className="lm-empty">
              Cargando pacientes...
            </div>
          )}

          {/* SIN RESULTADOS */}
          {!cargando &&
            !error &&
            mascotasFiltradas.length === 0 && (
              <div className="lm-empty">
                <PawPrint size={34} />

                <h3>No se encontraron mascotas</h3>

                <p>
                  Intenta otra búsqueda o registra
                  una nueva mascota.
                </p>
              </div>
            )}
        </div>

        {/* PIE DE TABLA */}
        <div className="lm-footer">
          Mostrando {mascotasFiltradas.length} de{" "}
          {mascotas.length} pacientes
        </div>

      </section>
    </div>
  );
}
