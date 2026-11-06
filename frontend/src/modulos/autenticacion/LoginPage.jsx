import React, { useState } from 'react';
import './LoginPage.css';
import mascotasLogin from '../../assets/mascotas-login.png';
import { AlertTriangle, LockKeyhole, LogIn, PawPrint, ShieldCheck, User } from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Ingresá tu usuario y contraseña.');
      return;
    }

    setCargando(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Usuario o contraseña incorrectos.');
        }

        throw new Error(
          'No se pudo iniciar sesión. Verificá la conexión con el servidor.'
        );
      }

      const data = await response.json();

      if (!data?.username || !data?.rol) {
        throw new Error('El servidor no devolvió una sesión válida.');
      }

      onLogin(data);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="gcv-login-screen">
      <section className="gcv-login-card">

        <div className="gcv-login-brand">

          <div className="gcv-login-brand-label">
            <PawPrint size={18} />
            CLÍNICA VETERINARIA
          </div>

          <div className="gcv-login-brand-content">

            <div className="gcv-login-welcome">
              <h1>
                Bienvenido a
                <span>Gestión Veterinaria</span>
              </h1>

              <p>
                Administración de pacientes, citas,
                expedientes clínicos y vacunación
                en un solo lugar.
              </p>
            </div>

            <div className="gcv-login-pets">
              <img
                src={mascotasLogin}
                alt="Perro y gato de la clínica veterinaria"
                className="gcv-login-pets-image"
              />
            </div>

          </div>

          <div className="gcv-login-brand-footer">
            <span>Universidad de El Salvador (UES)</span>
            <span>© 2026</span>
          </div>

        </div>

        <div className="gcv-login-form-side">

          <div className="gcv-login-form-wrap">

            <div className="gcv-login-icon">
              <LockKeyhole size={30} />
            </div>

            <div className="gcv-login-heading">
              <h2>Iniciar sesión</h2>
              <p>
                Ingresá tus credenciales para acceder
                al sistema.
              </p>
            </div>

            {error && (
              <div className="gcv-login-error" role="alert">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="gcv-login-field">
                <label htmlFor="gcv-usuario">
                  Usuario
                </label>

                <div className="gcv-login-input-wrapper">
                  <span className="gcv-input-icon"><User size={18} /></span>

                  <input
                    id="gcv-usuario"
                    type="text"
                    placeholder="Ingresá tu usuario"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={cargando}
                    required
                  />
                </div>
              </div>

              <div className="gcv-login-field">
                <label htmlFor="gcv-password">
                  Contraseña
                </label>

                <div className="gcv-login-input-wrapper">
                  <span className="gcv-input-icon"><LockKeyhole size={18} /></span>

                  <input
                    id="gcv-password"
                    type={mostrarPassword ? 'text' : 'password'}
                    placeholder="Ingresá tu contraseña"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={cargando}
                    required
                  />

                  <button
                    type="button"
                    className="gcv-password-toggle"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    aria-label={
                      mostrarPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <button
                className="gcv-login-submit"
                type="submit"
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span className="gcv-login-spinner"></span>
                    Verificando credenciales...
                  </>
                ) : (
                  <><LogIn size={18} /> Iniciar sesión</>
                )}
              </button>

            </form>

            <div className="gcv-login-security">
              <ShieldCheck size={18} />
              Acceso exclusivo para personal autorizado
            </div>

          </div>
        </div>

      </section>
    </main>
  );
}
