import { useState } from 'react';
import { useAppStore } from './hooks/useAppStore';
import { Sidebar, MobileToggle } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { EmployeesView } from './components/EmployeesView';
import { AttendanceView } from './components/AttendanceView';
import { LeavesView } from './components/LeavesView';
import { PayrollView } from './components/PayrollView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import type { AppView } from './types';

const titles: Record<AppView, { title: string; sub: string }> = {
  dashboard: {
    title: 'لوحة التحكم',
    sub: 'نظرة يومية على الحضور والقوى العاملة',
  },
  employees: {
    title: 'إدارة الموظفين',
    sub: 'بيانات الموظفين والرواتب والدوام',
  },
  attendance: {
    title: 'الحضور والانصراف',
    sub: 'تسجيل ومتابعة أوقات الدخول والخروج',
  },
  leaves: {
    title: 'الإجازات',
    sub: 'طلبات الإجازة والموافقات',
  },
  payroll: {
    title: 'حساب الرواتب',
    sub: 'مسير شهري كامل مع الخصومات والمكافآت',
  },
  reports: {
    title: 'التقارير',
    sub: 'تحليلات الحضور وتوزيع الرواتب',
  },
  settings: {
    title: 'الإعدادات',
    sub: 'سياسات الدوام والخصومات',
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
        companyName={store.settings.companyName}
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
              title="شهر الرواتب"
            />
          </div>
        </div>

        {store.view === 'dashboard' && <DashboardView store={store} />}
        {store.view === 'employees' && <EmployeesView store={store} />}
        {store.view === 'attendance' && <AttendanceView store={store} />}
        {store.view === 'leaves' && <LeavesView store={store} />}
        {store.view === 'payroll' && <PayrollView store={store} />}
        {store.view === 'reports' && <ReportsView store={store} />}
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
