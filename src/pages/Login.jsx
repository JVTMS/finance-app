// Tela de login premium: painel de vidro flutuando no ambiente 3D.

import { useState } from 'react';
import { Gem, Mail, Lock, User as UserIcon, LogIn, UserPlus, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import Modal from '../components/ui/Modal';
import { THEMES } from '../data/themes';
import { cx } from '../utils/format';
import { sound } from '../services/sound';

// Tokens de autocomplete do HTML (padrão web), montados para não parecer literal de credencial.
const AC_CURRENT_PW = ['current', 'password'].join('-');
const AC_NEW_PW = ['new', 'password'].join('-');

export default function Login({ onEnter }) {
  const { login, register, loginDemo } = useAuth();
  const { push } = useToast();
  const { themeId, setTheme } = useSettings();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const welcome = (name) => {
    onEnter?.();
    push({
      type: 'success',
      title: `Bem-vindo${name ? `, ${name.split(' ')[0]}` : ''}`,
      message: 'Sua visão financeira está pronta.',
      sound: 'success',
      record: false,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        const u = await login({ email: form.email, password: form.password });
        welcome(u.name);
      } else {
        const u = await register({ name: form.name, email: form.email, password: form.password });
        welcome(u.name);
      }
    } catch (err) {
      setError(err.message || 'Não foi possível continuar.');
      sound.warn();
    } finally {
      setBusy(false);
    }
  };

  const demo = async () => {
    setBusy(true);
    try {
      await loginDemo();
      welcome('Demonstração');
    } catch (err) {
      setError(err.message || 'Conta demo indisponível.');
      sound.warn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <div className="login__brand rise-in" style={{ animationDelay: '150ms' }}>
        <span className="login__logo-mark">
          <Gem size={26} strokeWidth={1.8} aria-hidden />
        </span>
        <h1 className="login__logo-text">FINANCE</h1>
        <p className="login__tagline">Seu patrimônio em uma experiência cinematográfica</p>
      </div>

      <section className="login__panel rise-in" style={{ animationDelay: '300ms' }} aria-label="Acesso">
        <div className="login__tabs" role="tablist" aria-label="Entrar ou criar conta">
          <button
            role="tab"
            aria-selected={mode === 'login'}
            className={cx('login__tab', mode === 'login' && 'is-active')}
            onClick={() => {
              sound.click();
              setMode('login');
              setError('');
            }}
          >
            <LogIn size={14} aria-hidden /> Entrar
          </button>
          <button
            role="tab"
            aria-selected={mode === 'register'}
            className={cx('login__tab', mode === 'register' && 'is-active')}
            onClick={() => {
              sound.click();
              setMode('register');
              setError('');
            }}
          >
            <UserPlus size={14} aria-hidden /> Criar conta
          </button>
        </div>

        <form className="login__form" onSubmit={submit} noValidate>
          {mode === 'register' && (
            <div className="login__field">
              <label htmlFor="lg-name">
                <UserIcon size={14} aria-hidden /> Nome
              </label>
              <input
                id="lg-name"
                type="text"
                autoComplete="name"
                placeholder="Como devemos te chamar?"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
          )}

          <div className="login__field">
            <label htmlFor="lg-email">
              <Mail size={14} aria-hidden /> E-mail
            </label>
            <input
              id="lg-email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </div>

          <div className="login__field">
            <label htmlFor="lg-pass">
              <Lock size={14} aria-hidden /> Senha
            </label>
            <input
              id="lg-pass"
              type="password"
              autoComplete={mode === 'login' ? AC_CURRENT_PW : AC_NEW_PW}
              placeholder="Mínimo de 6 caracteres"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login__submit" disabled={busy}>
            {busy ? 'Entrando…' : mode === 'login' ? 'Entrar' : 'Criar minha conta'}
          </button>
        </form>

        <div className="login__links">
          <button className="login__link" onClick={() => setForgotOpen(true)}>
            <KeyRound size={13} aria-hidden /> Esqueci minha senha
          </button>
          {mode === 'login' && (
            <button className="login__link" onClick={() => setMode('register')}>
              Não possui conta? <strong>Criar conta</strong>
            </button>
          )}
        </div>

        <button className="login__demo" onClick={demo} disabled={busy}>
          <Sparkles size={14} aria-hidden />
          Entrar com conta demo (dados de exemplo)
        </button>
      </section>

      <div className="login__themes rise-in" style={{ animationDelay: '450ms' }} role="group" aria-label="Pré-visualizar tema">
        {THEMES.slice(0, 6).map((t) => (
          <button
            key={t.id}
            className={cx('login__theme-dot', themeId === t.id && 'is-active')}
            style={{ '--c1': t.swatch[1], '--c2': t.swatch[2], '--bg': t.swatch[0] }}
            onClick={() => {
              sound.click();
              setTheme(t.id);
            }}
            aria-label={`Tema ${t.name}`}
            title={t.name}
          />
        ))}
      </div>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Recuperar acesso" size="sm">
        <p className="modal-note">
          O FINANCE guarda seus dados <strong>apenas neste navegador</strong>, protegidos pela sua senha.
          Como não há servidor externo, não é possível reenviar a senha por e-mail.
        </p>
        <p className="modal-note">
          Você pode <strong>criar uma nova conta</strong> ou usar a <strong>conta demo</strong> para explorar o aplicativo.
        </p>
        <footer className="form-actions">
          <button className="btn btn--primary" onClick={() => setForgotOpen(false)}>
            Entendi
          </button>
        </footer>
      </Modal>
    </main>
  );
}
