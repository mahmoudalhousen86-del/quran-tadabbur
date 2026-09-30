import {
  LayoutDashboard,
  Users,
  Clock3,
  CalendarOff,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import type { AppView } from '../types';

const items: { id: AppView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'employees', label: 'الموظفون', icon: Users },
  { id: 'attendance', label: 'الحضور والانصراف', icon: Clock3 },
  { id: 'leaves', label: 'الإجازات', icon: CalendarOff },
  { id: 'payroll', label: 'الرواتب', icon: Wallet },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

interface Props {
  view: AppView;
  onNavigate: (v: AppView) => void;
  companyName: string;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ view, onNavigate, companyName, open, onClose }: Props) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">ح</div>
        <div>
          <h1>نظام الحضور والرواتب</h1>
          <p>{companyName}</p>
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
        البيانات محفوظة محلياً على جهازك
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
