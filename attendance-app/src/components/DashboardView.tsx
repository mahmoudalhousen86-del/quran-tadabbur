import { useMemo } from 'react';
import { LogIn, LogOut, Users, Wallet, Clock3, UserX } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AppStore } from '../hooks/useAppStore';
import { formatMinutes, formatMoney, todayISO } from '../lib/payroll';
import { StatusBadge } from './ui';

export function DashboardView({ store }: { store: AppStore }) {
  const today = todayISO();
  const todayAtt = store.attendance.filter((a) => a.date === today);
  const present = todayAtt.filter((a) => a.checkIn).length;
  const pendingOut = todayAtt.filter((a) => a.checkIn && !a.checkOut).length;
  const late = todayAtt.filter((a) => a.lateMinutes > 0).length;
  const onLeave = store.leaves.filter(
    (l) => l.status === 'موافق' && l.fromDate <= today && l.toDate >= today,
  ).length;
  const absentGuess = Math.max(0, store.activeEmployees.length - present - onLeave);
  const payrollTotal = store.payroll.reduce((s, p) => s + p.netSalary, 0);

  const deptData = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of store.activeEmployees) {
      map.set(e.department, (map.get(e.department) || 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [store.activeEmployees]);

  const notChecked = store.activeEmployees.filter(
    (e) =>
      !todayAtt.some((a) => a.employeeId === e.id && a.checkIn) &&
      !store.leaves.some(
        (l) =>
          l.employeeId === e.id &&
          l.status === 'موافق' &&
          l.fromDate <= today &&
          l.toDate >= today,
      ),
  );

  return (
    <>
      <div className="grid-stats">
        <div className="stat">
          <div className="label">الموظفون النشطون</div>
          <div className="value">{store.activeEmployees.length}</div>
          <div className="hint">
            <Users size={14} style={{ verticalAlign: 'middle' }} /> إجمالي القوى العاملة
          </div>
        </div>
        <div className="stat">
          <div className="label">حضور اليوم</div>
          <div className="value">{present}</div>
          <div className="hint">متأخرون: {late} · بانتظار الانصراف: {pendingOut}</div>
        </div>
        <div className="stat">
          <div className="label">غياب / إجازة</div>
          <div className="value">{absentGuess}</div>
          <div className="hint">إجازات اليوم: {onLeave}</div>
        </div>
        <div className="stat">
          <div className="label">صافي رواتب الشهر</div>
          <div className="value" style={{ fontSize: '1.25rem' }}>
            {formatMoney(payrollTotal, store.settings.currency)}
          </div>
          <div className="hint">
            <Wallet size={14} style={{ verticalAlign: 'middle' }} /> {store.selectedMonth}
          </div>
        </div>
      </div>

      <div className="layout-2">
        <div className="panel">
          <div className="panel-head">
            <h3>تسجيل سريع — {today}</h3>
          </div>
          <div className="quick-list">
            {store.activeEmployees.map((emp) => {
              const rec = todayAtt.find((a) => a.employeeId === emp.id);
              const onLeaveToday = store.leaves.some(
                (l) =>
                  l.employeeId === emp.id &&
                  l.status === 'موافق' &&
                  l.fromDate <= today &&
                  l.toDate >= today,
              );
              return (
                <div className="quick-item" key={emp.id}>
                  <div>
                    <strong>{emp.name}</strong>
                    <span>
                      {emp.jobTitle} · {emp.department}
                      {rec?.checkIn ? ` · حضور ${rec.checkIn}` : ''}
                      {rec?.checkOut ? ` · انصراف ${rec.checkOut}` : ''}
                      {onLeaveToday ? ' · في إجازة' : ''}
                    </span>
                  </div>
                  <div className="actions">
                    {!rec?.checkIn && !onLeaveToday && (
                      <button className="btn btn-primary btn-sm" onClick={() => store.checkIn(emp.id)}>
                        <LogIn size={14} /> حضور
                      </button>
                    )}
                    {rec?.checkIn && !rec.checkOut && (
                      <button className="btn btn-accent btn-sm" onClick={() => store.checkOut(emp.id)}>
                        <LogOut size={14} /> انصراف
                      </button>
                    )}
                    {rec?.checkIn && rec.checkOut && <StatusBadge status={rec.status} />}
                    {onLeaveToday && <StatusBadge status="موافق" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>توزيع الأقسام</h3>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,198,210,0.15)" />
                <XAxis dataKey="name" tick={{ fill: '#8fb0bd', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#8fb0bd', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#123042',
                    border: '1px solid rgba(140,198,210,0.2)',
                    borderRadius: 10,
                  }}
                />
                <Bar dataKey="value" fill="#2ec4b6" radius={[8, 8, 0, 0]} name="موظفون" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel-head" style={{ marginTop: '1rem' }}>
            <h3>
              <UserX size={16} style={{ verticalAlign: 'middle' }} /> لم يسجلوا حضوراً
            </h3>
          </div>
          {notChecked.length === 0 ? (
            <div className="empty">الجميع مسجل أو في إجازة</div>
          ) : (
            <div className="chips">
              {notChecked.map((e) => (
                <span className="chip" key={e.id}>
                  {e.name}
                </span>
              ))}
            </div>
          )}

          <div className="panel-head" style={{ marginTop: '1rem' }}>
            <h3>
              <Clock3 size={16} style={{ verticalAlign: 'middle' }} /> ملخص تأخير اليوم
            </h3>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>التأخير</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {todayAtt.filter((a) => a.lateMinutes > 0).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty">
                      لا توجد تأخيرات
                    </td>
                  </tr>
                ) : (
                  todayAtt
                    .filter((a) => a.lateMinutes > 0)
                    .map((a) => {
                      const emp = store.employees.find((e) => e.id === a.employeeId);
                      return (
                        <tr key={a.id}>
                          <td>{emp?.name}</td>
                          <td>{formatMinutes(a.lateMinutes)}</td>
                          <td>
                            <StatusBadge status={a.status} />
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
