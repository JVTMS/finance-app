// Configurações: aparência (temas), experiência (cinematic/performance), som e conta.

import { useState } from 'react';
import {
  Film, Gauge, Volume2, VolumeX, Palette, ShieldCheck, Trash2, MonitorSmartphone,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFinance } from '../context/FinanceContext';
import ThemeSelector from '../components/ThemeSelector';
import Modal from '../components/ui/Modal';
import { sound } from '../services/sound';
import * as api from '../api/api';
import { formatBRL } from '../utils/format';

function Toggle({ checked, onChange, label, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      className={`toggle ${checked ? 'is-on' : ''}`}
      onClick={() => {
        sound.click();
        onChange(!checked);
      }}
    >
      <span className="toggle__track" aria-hidden>
        <span className="toggle__thumb" />
      </span>
      <span className="toggle__state">{checked ? 'ON' : 'OFF'}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

function SettingsRow({ icon: Icon, title, description, children }) {
  return (
    <div className="settings-row rise-in">
      <span className="settings-row__icon">
        <Icon size={17} aria-hidden />
      </span>
      <div className="settings-row__text">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="settings-row__control">{children}</div>
    </div>
  );
}

export default function Settings() {
  const {
    cinematic, setCinematic, performance, setPerformance, soundOn, setSoundOn, themeId,
  } = useSettings();
  const { user, logout } = useAuth();
  const { push } = useToast();
  const { accounts, transactions, investments } = useFinance();
  const [wipeOpen, setWipeOpen] = useState(false);

  const total = accounts.reduce((s, a) => s + Math.max(0, a.initialBalance), 0);

  const doWipe = async () => {
    try {
      await api.deleteMyData();
      push({ type: 'info', title: 'Dados apagados', record: false });
    } catch {
      push({ type: 'warn', title: 'Não foi possível apagar no servidor', record: false });
    }
    logout();
    window.location.hash = '#/dashboard';
    window.location.reload();
  };

  return (
    <div className="page page--settings">
      <section className="settings-section" aria-label="Aparência">
        <h2 className="settings-section__title">
          <Palette size={16} aria-hidden /> Aparência
        </h2>
        <ThemeSelector />
      </section>

      <section className="settings-section" aria-label="Experiência">
        <h2 className="settings-section__title">Experiência</h2>
        <SettingsRow
          icon={Film}
          title="Cinematic Mode"
          description="Iluminação dinâmica, partículas, parallax e reflexos mais presentes."
        >
          <Toggle checked={cinematic} onChange={setCinematic} label="Cinematic Mode" id="tg-cinematic" />
        </SettingsRow>
        <SettingsRow
          icon={Gauge}
          title="Performance Mode"
          description="Remove partículas e efeitos 3D, reduz blur e animações. Ideal para computadores mais fracos."
        >
          <Toggle checked={performance} onChange={setPerformance} label="Performance Mode" id="tg-perf" />
        </SettingsRow>
        <SettingsRow
          icon={soundOn ? Volume2 : VolumeX}
          title="Som da interface"
          description="Sons discretos de clique, receita e despesa. Desativado por padrão."
        >
          <Toggle
            checked={soundOn}
            onChange={(v) => {
              setSoundOn(v);
              if (v) setTimeout(() => sound.success(), 60);
            }}
            label="Som da interface"
            id="tg-sound"
          />
        </SettingsRow>
      </section>

      <section className="settings-section" aria-label="Conta e dados">
        <h2 className="settings-section__title">
          <ShieldCheck size={16} aria-hidden /> Conta e dados
        </h2>
        <SettingsRow
          icon={ShieldCheck}
          title="Segurança"
          description="Sua senha é armazenada como hash SHA-256 com salt — nunca em texto puro. Os dados ficam somente neste navegador."
        >
          <span className="settings-chip">Protegido</span>
        </SettingsRow>
        <SettingsRow
          icon={MonitorSmartphone}
          title="Sessão"
          description={`Conectado como ${user?.name} (${user?.email}). A sessão expira automaticamente em 30 dias.`}
        >
          <span className="settings-chip">Ativa</span>
        </SettingsRow>
        <SettingsRow
          icon={Trash2}
          title="Apagar todos os dados"
          description={`Remove transações, contas, investimentos e preferências da sua conta no servidor (${accounts.length} contas · ${transactions.length} transações · ${formatBRL(total)} em saldos iniciais). Esta ação não pode ser desfeita.`}
        >
          <button className="btn btn--danger" onClick={() => setWipeOpen(true)}>
            Apagar tudo
          </button>
        </SettingsRow>
      </section>

      <Modal open={wipeOpen} onClose={() => setWipeOpen(false)} title="Apagar todos os dados?" size="sm">
        <p className="modal-note">
          Todos os usuários, contas, transações e investimentos deste navegador serão removidos permanentemente.
          Você voltará para a tela de login.
        </p>
        <footer className="form-actions">
          <button className="btn btn--ghost" onClick={() => setWipeOpen(false)}>
            Cancelar
          </button>
          <button
            className="btn btn--danger"
            onClick={() => {
              push({ type: 'info', title: 'Dados apagados', record: false });
              doWipe();
            }}
          >
            Apagar definitivamente
          </button>
        </footer>
      </Modal>
    </div>
  );
}
