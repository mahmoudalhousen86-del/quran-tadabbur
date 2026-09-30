import {
  Home,
  Clock3,
  CalendarOff,
  Wallet,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import type { AppView } from '../types';

const items: { id: AppView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'attendance', label: 'سجلي', icon: Clock3 },
  { id: 'leaves', label: 'إجازاتي', icon: CalendarOff },
  { id: 'salary', label: 'راتبي', icon: Wallet },
  { id: 'settings', label: 'ملفي', icon: Settings },
];

interface Props {
  view: AppView;
  onNavigate: (v: AppView) => void;
  name: string;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ view, onNavigate, name, open, onClose }: Props) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">ح</div>
        <div>
          <h1>حضوري وراتبي</h1>
          <p>{name}</p>
        </div>
      </div>
      <nav className="nav">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-btn ${view === id ? 'active' : ''}`}
            onClick={() => {
              onNavigate(id);
              onClose();
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="chip" style={{ justifyContent: 'center' }}>
        تطبيق شخصي — بياناتك على جهازك فقط
      </div>
    </aside>
  );
}

export function MobileToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button className="mobile-toggle" onClick={onToggle} aria-label="القائمة">
      {open ? <X size={20} /> : <Menu size={20} />}
    </button>
  );
}
