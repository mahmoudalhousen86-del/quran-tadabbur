import { LogIn, LogOut, Clock3, Wallet, CalendarDays } from 'lucide-react';
import type { AppStore } from '../hooks/useAppStore';
import { formatMinutes, formatMoney, todayISO } from '../lib/payroll';
import { StatusBadge } from './ui';

export function HomeView({ store }: { store: AppStore }) {
  const today = todayISO();
  const rec = store.todayRecord;
  const salary = store.monthSalary;
  const onLeave = store.leaves.some((l) => l.fromDate <= today && l.toDate >= today);

  return (
    <>
      <div className="hero-card">
        <div className="hero-greet">
          <p>مرحباً</p>
          <h3>{store.profile.name}</h3>
          <span>
            {store.profile.jobTitle}
            {store.profile.workplace ? ` · ${store.profile.workplace}` : ''}
          </span>
        </div>
        <div className="hero-date">{today}</div>

        {onLeave ? (
          <div className="hero-status">
            <StatusBadge status="غائب" />
            <p>أنت في إجازة اليوم</p>
          </div>
        ) : (
          <div className="hero-actions">
            {!rec?.checkIn && (
              <button className="btn btn-primary btn-xl" onClick={() => store.checkIn()}>
                <LogIn size={22} /> تسجيل حضوري الآن
              </button>
            )}
            {rec?.checkIn && !rec.checkOut && (
              <button className="btn btn-accent btn-xl" onClick={() => store.checkOut()}>
                <LogOut size={22} /> تسجيل انصرافي الآن
              </button>
            )}
            {rec?.checkIn && rec.checkOut && (
              <div className="hero-status">
                <StatusBadge status={rec.status} />
                <p>
                  حضور {rec.checkIn} · انصراف {rec.checkOut}
                </p>
              </div>
            )}
          </div>
        )}

        {rec?.checkIn && (
          <div className="hero-meta">
            <div>
              <small>الحضور</small>
              <strong>{rec.checkIn}</strong>
            </div>
            <div>
              <small>الانصراف</small>
              <strong>{rec.checkOut || '—'}</strong>
            </div>
            <div>
              <small>العمل</small>
              <strong>{formatMinutes(rec.workedMinutes)}</strong>
            </div>
            <div>
              <small>إضافي</small>
              <strong>{formatMinutes(rec.overtimeMinutes)}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="grid-stats">
        <div className="stat">
          <div className="label">صافي راتبي هذا الشهر</div>
          <div className="value" style={{ fontSize: '1.35rem' }}>
            {formatMoney(salary.netSalary, store.profile.currency)}
          </div>
          <div className="hint">
            <Wallet size={14} style={{ verticalAlign: 'middle' }} /> {store.selectedMonth}
          </div>
        </div>
        <div className="stat">
          <div className="label">أيام حضوري</div>
          <div className="value">{salary.presentDays}</div>
          <div className="hint">تأخير: {salary.lateCount} مرة</div>
        </div>
        <div className="stat">
          <div className="label">ساعات عملي</div>
          <div className="value" style={{ fontSize: '1.35rem' }}>
            {salary.workedHours}
          </div>
          <div className="hint">
            <Clock3 size={14} style={{ verticalAlign: 'middle' }} /> إضافي{' '}
            {formatMinutes(salary.overtimeMinutes)}
          </div>
        </div>
        <div className="stat">
          <div className="label">إجازاتي / غيابي</div>
          <div className="value">
            {salary.leaveDays}/{salary.absentDays}
          </div>
          <div className="hint">
            <CalendarDays size={14} style={{ verticalAlign: 'middle' }} /> خلال الشهر
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>دوامي المعتاد</h3>
        </div>
        <div className="chips">
          <span className="chip on">
            من {store.profile.schedule.startTime} إلى {store.profile.schedule.endTime}
          </span>
          <span className="chip on">{store.profile.schedule.dailyHours} ساعات يومياً</span>
          <span className="chip">
            الراتب الأساسي {formatMoney(store.profile.baseSalary, store.profile.currency)}
          </span>
        </div>
      </div>
    </>
  );
}
