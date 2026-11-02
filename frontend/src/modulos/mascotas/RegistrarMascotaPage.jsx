
import React, { useEffect, useState } from 'react';
import {
  obtenerPropietariosParaSelect,
  registrarMascota
} from './mascotasService';
import './RegistrarMascotaPage.css';

const formularioInicial = {
  nombre: '',
  especie: '',
  raza: '',
  sexo: 'Macho',
  fechaNacimiento: '',
  edadEstimada: '',
  color: '',
  pesoInicial: '',
  propietarioId: ''
};

const razasPorEspecie = {
  Canino: ['Labrador Retriever', 'Golden Retriever', 'Pastor Alemán', 'Bulldog francés', 'Chihuahua', 'Poodle', 'Mestizo'],
  Felino: ['Siamés', 'Persa', 'Maine Coon', 'Común Europeo', 'Mestizo'],
  Ave: ['Periquito', 'Canario', 'Loro', 'Agapornis'],
  Conejo: ['Mini Lop', 'Holandés', 'Cabeza de León'],
  Roedor: ['Hámster', 'Cobaya', 'Ratón doméstico'],
  Reptil: ['Iguana', 'Gecko', 'Tortuga'],
  Pez: ['Betta', 'Goldfish', 'Guppy'],
  Otro: []
};

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return '';
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number);
  const hoy = new Date();
  const nacimiento = new Date(anio, mes - 1, dia);
  if (nacimiento > hoy) return '';
  let anios = hoy.getFullYear() - anio;
  let meses = hoy.getMonth() - (mes - 1);
  if (hoy.getDate() < dia) meses--;
  if (meses < 0) { anios--; meses += 12; }
  return `${anios} años, ${meses} meses`;
}

export default function RegistrarMascotaPage({ onVolver }) {
  const [form, setForm] = useState(formularioInicial);
  const [propietarios, setPropietarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    let activo = true;

    async function cargarPropietarios() {
      try {
        const datos = await obtenerPropietariosParaSelect();
        if (activo) {
          setPropietarios(Array.isArray(datos) ? datos : []);
        }
      } catch (err) {
        if (activo) setError('No se pudieron cargar los propietarios.');
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarPropietarios();
    return () => { activo = false; };
  }, []);

  const propietarioSeleccionado = propietarios.find(
    p => String(p.idPropietario) === String(form.propietarioId)
  );

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'especie' ? { raza: '' } : {}),
      ...(name === 'fechaNacimiento' ? { edadEstimada: calcularEdad(value) } : {}),
      ...(name === 'edadEstimada' && !prev.fechaNacimiento && value ? { fechaNacimiento: '' } : {})
    }));
    setError('');
    setExito('');
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (!form.propietarioId) {
      setError('Seleccioná un propietario registrado.');
      return;
    }

    if (!form.nombre.trim() || !form.especie.trim()) {
      setError('Ingresá el nombre y la especie de la mascota.');
      return;
    }

    if (form.fechaNacimiento && new Date(`${form.fechaNacimiento}T00:00:00`) > new Date()) {
      setError('La fecha de nacimiento no puede ser futura.');
      return;
    }

    if (form.pesoInicial !== '' && (!Number.isFinite(Number(form.pesoInicial)) || Number(form.pesoInicial) <= 0 || Number(form.pesoInicial) > 999.99)) {
      setError('Ingresá un peso inicial válido, mayor que cero y de hasta 999.99 kg.');
      return;
    }

    const datos = {
      nombre: form.nombre.trim(),
      especie: form.especie.trim(),
      raza: form.raza === 'Otra' ? '' : form.raza.trim(),
      sexo: form.sexo,
      fechaNacimiento: form.fechaNacimiento || null,
      edadEstimada: form.fechaNacimiento ? calcularEdad(form.fechaNacimiento) : form.edadEstimada.trim() || null,
      color: form.color.trim(),
      pesoInicial: form.pesoInicial === '' ? null : Number(form.pesoInicial),
      propietario: {
        idPropietario: Number(form.propietarioId)
      }
    };

    try {
      setGuardando(true);
      const respuesta = await registrarMascota(datos);
      setExito(
        `Mascota registrada exitosamente. Expediente: ${
          respuesta.codigoExpediente || 'Generado'
        }`
      );
      setForm(formularioInicial);
    } catch (err) {
      console.error('Error al registrar mascota:', err);
      setError(
        err.response?.data?.mensaje ||
        'No se pudo registrar la mascota. Verificá los datos y la conexión con el servidor.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mas-page">
      <div className="mas-header">
        <div>
          <div className="mas-breadcrumb">
            Dashboard › Gestión de Mascotas
          </div>
          <h1>Registrar Nueva Mascota</h1>
          <p>
            Historia GCV-3 [MAS-01] · Registro de paciente
            y apertura de expediente clínico.
          </p>
        </div>
        <button type="button" className="mas-back" onClick={onVolver}>
          ← Volver al Dashboard
        </button>
      </div>

      {error && <div className="mas-alert mas-error">{error}</div>}
      {exito && <div className="mas-alert mas-success">{exito}</div>}

      <form onSubmit={guardar} className="mas-layout">
        <div className="mas-main">
          <section className="mas-card">
            <h2>1. Asignación del Propietario</h2>
            <div className="mas-field">
              <label htmlFor="mas-propietario">
                Propietario Responsable *
              </label>
              <select
                id="mas-propietario"
                name="propietarioId"
                value={form.propietarioId}
                onChange={cambiar}
                required
                disabled={cargando}
              >
                <option value="">
                  {cargando
                    ? 'Cargando propietarios...'
                    : '-- Seleccione un propietario --'}
                </option>
                {propietarios.map(p => (
                  <option key={p.idPropietario} value={p.idPropietario}>
                    {p.nombres} {p.apellidos} — DUI: {p.dui}
                  </option>
                ))}
              </select>
              <small>
                La mascota debe estar asociada a un propietario
                previamente registrado en PostgreSQL.
              </small>
            </div>

            {propietarioSeleccionado && (
              <div className="mas-owner">
                <strong>
                  {propietarioSeleccionado.nombres}{' '}
                  {propietarioSeleccionado.apellidos}
                </strong>
                <span>
                  DUI: {propietarioSeleccionado.dui} ·
                  Tel: {propietarioSeleccionado.telefono}
                </span>
              </div>
            )}
          </section>

          <section className="mas-card">
            <h2>2. Datos de Identificación de la Mascota</h2>
            <div className="mas-grid">
              <div className="mas-field">
                <label htmlFor="mas-nombre">Nombre de la Mascota *</label>
                <input id="mas-nombre" name="nombre"
                  value={form.nombre} onChange={cambiar}
                  placeholder="Ej. Max" required maxLength={100} />
              </div>
              <div className="mas-field">
                <label htmlFor="mas-especie">Especie *</label>
                <select id="mas-especie" name="especie"
                  value={form.especie} onChange={cambiar} required>
                  <option value="">-- Seleccione una especie --</option>
                  {Object.keys(razasPorEspecie).map(especie => (
                    <option key={especie} value={especie}>{especie}</option>
                  ))}
                </select>
              </div>
              <div className="mas-field">
                <label htmlFor="mas-raza">Raza</label>
                <select id="mas-raza" name="raza"
                  value={form.raza === 'Otra' || (form.raza && !(razasPorEspecie[form.especie] || []).includes(form.raza)) ? 'Otra' : form.raza}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setForm(prev => ({ ...prev, raza: valor === 'Otra' ? 'Otra' : valor }));
                    setError(''); setExito('');
                  }} disabled={!form.especie}>
                  <option value="">-- Seleccione una raza --</option>
                  {(razasPorEspecie[form.especie] || []).map(raza => (
                    <option key={raza} value={raza}>{raza}</option>
                  ))}
                  <option value="Otra">Otra / No especificada</option>
                </select>
                {form.raza === 'Otra' || (form.raza && !razasPorEspecie[form.especie]?.includes(form.raza)) ? (
                  <input
                    aria-label="Especificar otra raza"
                    value={form.raza === 'Otra' ? '' : form.raza}
                    onChange={e => setForm(prev => ({ ...prev, raza: e.target.value || 'Otra' }))}
                    placeholder="Escribí la raza (opcional)"
                    maxLength={50}
                  />
                ) : null}
              </div>
              <div className="mas-field">
                <label htmlFor="mas-sexo">Sexo</label>
                <select id="mas-sexo" name="sexo"
                  value={form.sexo} onChange={cambiar}>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
              </div>
              <div className="mas-field">
                <label htmlFor="mas-peso">Peso Inicial (kg)</label>
                <input id="mas-peso" name="pesoInicial" type="number"
                  min="0.01" max="999.99" step="0.01"
                  value={form.pesoInicial} onChange={cambiar}
                  placeholder="Ej. 12.50" />
              </div>
              <div className="mas-field">
                <label htmlFor="mas-color">Color</label>
                <input id="mas-color" name="color"
                  value={form.color} onChange={cambiar}
                  placeholder="Ej. Café y blanco" maxLength={50} />
              </div>
            </div>
          </section>

          <section className="mas-card">
            <h2>3. Información de Nacimiento</h2>
            <div className="mas-grid">
              <div className="mas-field">
                <label htmlFor="mas-fecha">Fecha de Nacimiento</label>
                <input id="mas-fecha" type="date"
                  name="fechaNacimiento"
                  value={form.fechaNacimiento}
                  onChange={cambiar}
                  disabled={Boolean(form.edadEstimada) && !form.fechaNacimiento}
                />
              </div>
              <div className="mas-field">
                <label htmlFor="mas-edad">Edad Estimada</label>
                <input id="mas-edad" name="edadEstimada"
                  value={form.edadEstimada} onChange={cambiar}
                  placeholder="Ej. 2 años, 6 meses"
                  maxLength={30}
                  readOnly={Boolean(form.fechaNacimiento)}
                />
              </div>
            </div>
            <small>
              Ingresá la fecha de nacimiento o la edad estimada.
            </small>
          </section>
        </div>

        <aside className="mas-card mas-summary">
          <div className="mas-summary-heading">
            <h2>Ficha del Paciente</h2>
            <span className="mas-tag">Nuevo</span>
          </div>

          <div className="mas-detail">
            <span>NOMBRE DEL PACIENTE</span>
            <strong>{form.nombre || 'Sin ingresar...'}</strong>
          </div>
          <div className="mas-detail">
            <span>ESPECIE / RAZA</span>
            <strong>
              {[form.especie, form.raza].filter(Boolean).join(' / ') || 'Pendiente'}
            </strong>
          </div>
          <div className="mas-detail">
            <span>SEXO</span>
            <strong>{form.sexo}</strong>
          </div>
          <div className="mas-detail">
            <span>PROPIETARIO RESPONSABLE</span>
            <strong>
              {propietarioSeleccionado
                ? `${propietarioSeleccionado.nombres} ${propietarioSeleccionado.apellidos}`
                : 'Sin seleccionar'}
            </strong>
          </div>
          <div className="mas-detail">
            <span>EXPEDIENTE CLÍNICO</span>
            <strong>Se genera al guardar</strong>
          </div>

          <div className="mas-actions">
            <button type="submit" className="mas-save" disabled={guardando}>
              {guardando ? 'Guardando...' : '✓ Registrar Mascota'}
            </button>
            <button type="button" className="mas-cancel" onClick={onVolver}>
              Cancelar
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
