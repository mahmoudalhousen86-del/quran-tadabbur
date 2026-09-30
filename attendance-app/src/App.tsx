import { useState } from 'react';
import { useAppStore } from './hooks/useAppStore';
import { Sidebar, MobileToggle } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { AttendanceView } from './components/AttendanceView';
import { LeavesView } from './components/LeavesView';
import { SalaryView } from './components/SalaryView';
import { SettingsView } from './components/SettingsView';
import type { AppView } from './types';

const titles: Record<AppView, { title: string; sub: string }> = {
  home: {
    title: 'الرئيسية',
    sub: 'سجل حضورك وانصرافك بضغطة',
  },
  attendance: {
    title: 'سجلي',
    sub: 'كل ايام حضوري وانصرافي',
  },
  leaves: {
    title: 'اجازاتي',
    sub: 'ايام اجازتي خلال الشهر',
  },
  salary: {
    title: 'راتبي',
    sub: 'حساب راتبي لهذا الشهر',
  },
  settings: {
    title: 'ملفي',
    sub: 'اسمي وراتبي ودوامي',
  },
};

export default function App() {
  const store = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = titles[store.view];

  return (
    <div className="app">
      <MobileToggle open={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
      <Sidebar
        view={store.view}
        onNavigate={store.setView}
        name={store.profile.name}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <main className="main">
        <div className="topbar">
          <div>
            <h2>{meta.title}</h2>
            <div className="sub">{meta.sub}</div>
          </div>
          <div className="toolbar">
            <input
              type="month"
              value={store.selectedMonth}
              onChange={(e) => store.setSelectedMonth(e.target.value)}
              title="الشهر"
            />
          </div>
        </div>

        {store.view === 'home' && <HomeView store={store} />}
        {store.view === 'attendance' && <AttendanceView store={store} />}
        {store.view === 'leaves' && <LeavesView store={store} />}
        {store.view === 'salary' && <SalaryView store={store} />}
        {store.view === 'settings' && <SettingsView store={store} />}
      </main>

      {store.flash && <div className="flash">{store.flash}</div>}
      {menuOpen && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 15 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
