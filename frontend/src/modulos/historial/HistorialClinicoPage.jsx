import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  LoaderCircle,
  PawPrint,
  Pill,
  Search,
  Stethoscope,
  Syringe,
  TriangleAlert,
  UserRound
} from 'lucide-react';
import { historialClinicoService } from './historialClinicoService';
import './HistorialClinicoPage.css';

const formatearFecha = (valor, incluirHora = true) => {
  if (!valor) return 'Fecha no disponible';

  let fecha;
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    fecha = new Date(anio, mes - 1, dia);
  } else {
    fecha = new Date(valor);
  }

  if (Number.isNaN(fecha.getTime())) return valor;

  return new Intl.DateTimeFormat('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(incluirHora ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(fecha);
};

export default function HistorialClinicoPage({ onVolver }) {
  const [mascotas, setMascotas] = useState([]);
  const [idMascota, setIdMascota] = useState('');
  const [historial, setHistorial] = useState(null);
  const [filtro, setFiltro] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [cargandoMascotas, setCargandoMascotas] = useState(true);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    historialClinicoService.listarMascotas()
      .then((data) => {
        if (activo) setMascotas(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (activo) setError(err.message || 'No se pudieron cargar las mascotas.');
      })
      .finally(() => {
        if (activo) setCargandoMascotas(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!idMascota) {
      setHistorial(null);
      return;
    }

    let activo = true;
    setCargandoHistorial(true);
    setError('');

    historialClinicoService.obtenerHistorial(idMascota)
      .then((data) => {
        if (activo) setHistorial(data);
      })
      .catch((err) => {
        if (activo) {
          setHistorial(null);
          setError(err.message || 'No se pudo cargar el historial clínico.');
        }
      })
      .finally(() => {
        if (activo) setCargandoHistorial(false);
      });

    return () => {
      activo = false;
    };
  }, [idMascota]);

  const mascotasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return mascotas;

    return mascotas.filter((mascota) =>
      [mascota.nombre, mascota.codigoExpediente, mascota.especie, mascota.raza]
        .filter(Boolean)
        .some((valor) => String(valor).toLowerCase().includes(termino))
    );
  }, [mascotas, busqueda]);

  const eventos = useMemo(() => {
    const lista = historial?.eventos || [];
    if (filtro === 'TODOS') return lista;
    return lista.filter((evento) => evento.tipo === filtro);
  }, [historial, filtro]);

  const renderConsulta = (evento) => (
    <div className="historial-evento historial-evento-consulta" key={`consulta-${evento.idReferencia}`}>
      <div className="historial-evento-icono">
        <Stethoscope size={20} />
      </div>

      <div className="historial-evento-contenido">
        <div className="historial-evento-cabecera">
          <div>
            <span className="historial-tipo historial-tipo-consulta">Consulta médica</span>
            <h3>{evento.consulta?.motivoConsulta || evento.titulo}</h3>
          </div>
          <div className="historial-fecha">
            <CalendarDays size={15} />
            {formatearFecha(evento.fechaHora)}
          </div>
        </div>

        <div className="historial-profesional">
          <UserRound size={15} />
          {evento.veterinario}
        </div>

        <div className="historial-detalle-grid">
          <div>
            <span>Diagnóstico</span>
            <strong>{evento.consulta?.diagnostico || 'Sin diagnóstico registrado'}</strong>
          </div>
          <div>
            <span>Observaciones</span>
            <strong>{evento.consulta?.observaciones || 'Sin observaciones registradas'}</strong>
          </div>
        </div>

        {(evento.consulta?.temperatura || evento.consulta?.pesoActual || evento.consulta?.frecuenciaCardiaca) && (
          <div className="historial-signos">
            <Activity size={16} />
            {evento.consulta?.temperatura && <span>{evento.consulta.temperatura} °C</span>}
            {evento.consulta?.pesoActual && <span>{evento.consulta.pesoActual} kg</span>}
            {evento.consulta?.frecuenciaCardiaca && <span>{evento.consulta.frecuenciaCardiaca} lpm</span>}
          </div>
        )}

        {evento.tratamientos?.length > 0 && (
          <div className="historial-tratamientos">
            <div className="historial-subtitulo">
              <Pill size={16} />
              Tratamiento prescrito
            </div>
            <div className="historial-tratamientos-lista">
              {evento.tratamientos.map((tratamiento) => (
                <div className="historial-tratamiento" key={tratamiento.idTratamiento}>
                  <strong>{tratamiento.medicamento}</strong>
                  <span>{tratamiento.dosis} · {tratamiento.frecuencia} · {tratamiento.duracion}</span>
                  {tratamiento.indicaciones && <small>{tratamiento.indicaciones}</small>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderVacuna = (evento) => (
    <div className="historial-evento historial-evento-vacuna" key={`vacuna-${evento.idReferencia}`}>
      <div className="historial-evento-icono">
        <Syringe size={20} />
      </div>

      <div className="historial-evento-contenido">
        <div className="historial-evento-cabecera">
          <div>
            <span className="historial-tipo historial-tipo-vacuna">Vacunación</span>
            <h3>{evento.vacuna?.nombreTipoVacuna || evento.titulo}</h3>
          </div>
          <div className="historial-fecha">
            <CalendarDays size={15} />
            {formatearFecha(evento.vacuna?.fechaAplicacion || evento.fechaHora, false)}
          </div>
        </div>

        <div className="historial-profesional">
          <UserRound size={15} />
          {evento.veterinario}
        </div>

        <div className="historial-detalle-grid">
          <div>
            <span>Lote</span>
            <strong>{evento.vacuna?.lote || 'No registrado'}</strong>
          </div>
          <div>
            <span>Próxima dosis</span>
            <strong>
              {evento.vacuna?.proximaDosis
                ? formatearFecha(evento.vacuna.proximaDosis, false)
                : 'No programada'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="historial-page">
      <div className="historial-page-header">
        <div>
          <div className="historial-breadcrumb">
            <span>Área clínica</span>
            <span>/</span>
            <strong>Historial Clínico</strong>
          </div>
          <h1>Historial Clínico</h1>
          <p>Consulta cronológica y consolidada del expediente médico de cada mascota.</p>
        </div>

        <button type="button" className="historial-btn-volver" onClick={onVolver}>
          <ArrowLeft size={16} />
          Volver al Dashboard
        </button>
      </div>

      {error && (
        <div className="historial-alerta">
          <TriangleAlert size={18} />
          {error}
        </div>
      )}

      <div className="historial-selector-card">
        <div className="historial-selector-titulo">
          <div className="historial-selector-icono">
            <PawPrint size={22} />
          </div>
          <div>
            <strong>Seleccionar paciente</strong>
            <span>Busca por nombre, expediente, especie o raza.</span>
          </div>
        </div>

        <div className="historial-selector-grid">
          <label className="historial-buscador">
            <Search size={17} />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar mascota..."
            />
          </label>

          <label className="historial-select-wrap">
            <ClipboardList size={17} />
            <select
              value={idMascota}
              onChange={(event) => setIdMascota(event.target.value)}
              disabled={cargandoMascotas}
            >
              <option value="">Selecciona una mascota</option>
              {mascotasFiltradas.map((mascota) => (
                <option key={mascota.idMascota} value={mascota.idMascota}>
                  {mascota.nombre} · {mascota.codigoExpediente || 'Sin expediente'}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {cargandoHistorial ? (
        <div className="historial-cargando">
          <LoaderCircle className="historial-spinner" size={28} />
          Cargando historial clínico...
        </div>
      ) : !historial ? (
        <div className="historial-vacio">
          <ClipboardList size={36} />
          <h3>Selecciona una mascota</h3>
          <p>El expediente clínico consolidado aparecerá en esta sección.</p>
        </div>
      ) : (
        <>
          <section className="historial-paciente-card">
            <div className="historial-paciente-principal">
              <div className="historial-avatar">
                <PawPrint size={28} />
              </div>
              <div>
                <span>{historial.mascota.codigoExpediente || 'Sin código de expediente'}</span>
                <h2>{historial.mascota.nombre}</h2>
                <p>
                  {historial.mascota.especie || 'Especie no especificada'} · {historial.mascota.raza || 'Raza no especificada'} · {historial.mascota.sexo || 'Sexo no especificado'}
                </p>
              </div>
            </div>

            <div className="historial-propietario">
              <UserRound size={18} />
              <div>
                <span>Propietario</span>
                <strong>{historial.propietario?.nombreCompleto || 'No disponible'}</strong>
                <small>{historial.propietario?.telefono || 'Sin teléfono'}</small>
              </div>
            </div>
          </section>

          <section className="historial-resumen-grid">
            <div className="historial-resumen-card">
              <Stethoscope size={20} />
              <div><strong>{historial.resumen.totalConsultas}</strong><span>Consultas</span></div>
            </div>
            <div className="historial-resumen-card">
              <Pill size={20} />
              <div><strong>{historial.resumen.totalTratamientos}</strong><span>Tratamientos</span></div>
            </div>
            <div className="historial-resumen-card">
              <Syringe size={20} />
              <div><strong>{historial.resumen.totalVacunas}</strong><span>Vacunas</span></div>
            </div>
          </section>

          <section className="historial-listado-card">
            <div className="historial-listado-header">
              <div>
                <h2>Línea de tiempo clínica</h2>
                <p>Registros cerrados ordenados de la atención más reciente a la más antigua.</p>
              </div>

              <div className="historial-filtros">
                <button type="button" className={filtro === 'TODOS' ? 'active' : ''} onClick={() => setFiltro('TODOS')}>
                  <FileText size={15} /> Todos
                </button>
                <button type="button" className={filtro === 'CONSULTA' ? 'active' : ''} onClick={() => setFiltro('CONSULTA')}>
                  <Stethoscope size={15} /> Consultas
                </button>
                <button type="button" className={filtro === 'VACUNA' ? 'active' : ''} onClick={() => setFiltro('VACUNA')}>
                  <Syringe size={15} /> Vacunas
                </button>
              </div>
            </div>

            {eventos.length === 0 ? (
              <div className="historial-sin-eventos">
                <ClipboardList size={30} />
                <strong>No hay registros para mostrar</strong>
                <span>Las consultas finalizadas y las vacunas aplicadas aparecerán automáticamente aquí.</span>
              </div>
            ) : (
              <div className="historial-timeline">
                {eventos.map((evento) =>
                  evento.tipo === 'VACUNA' ? renderVacuna(evento) : renderConsulta(evento)
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
