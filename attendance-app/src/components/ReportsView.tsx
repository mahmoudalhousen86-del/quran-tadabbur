import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AppStore } from '../hooks/useAppStore';
import { formatMoney, monthDays } from '../lib/payroll';

const COLORS = ['#2ec4b6', '#f4a261', '#4cc9f0', '#e9c46a', '#e76f51', '#90be6d'];

export function ReportsView({ store }: { store: AppStore }) {
  const month = store.selectedMonth;
  const days = monthDays(month);

  const attendanceTrend = useMemo(() => {
    return days.map((d) => {
      const dayAtt = store.attendance.filter((a) => a.date === d && a.checkIn);
      return {
        day: d.slice(-2),
        present: dayAtt.length,
        late: dayAtt.filter((a) => a.lateMinutes > 0).length,
      };
    });
  }, [days, store.attendance]);

  const deptPayroll = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of store.payroll) {
      map.set(p.department, (map.get(p.department) || 0) + p.netSalary);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [store.payroll]);

  const lateLeaders = useMemo(() => {
    const map = new Map<string, { name: string; late: number; overtime: number }>();
    for (const a of store.attendance.filter((x) => x.date.startsWith(month))) {
      const emp = store.employees.find((e) => e.id === a.employeeId);
      if (!emp) continue;
      const cur = map.get(emp.id) || { name: emp.name, late: 0, overtime: 0 };
      cur.late += a.lateMinutes;
      cur.overtime += a.overtimeMinutes;
      map.set(emp.id, cur);
    }
    return [...map.values()].sort((a, b) => b.late - a.late).slice(0, 8);
  }, [store.attendance, store.employees, month]);

  const totals = store.payroll.reduce(
    (acc, p) => ({
      net: acc.net + p.netSalary,
      ot: acc.ot + p.overtimePay,
      ded: acc.ded + p.totalDeductions,
      present: acc.present + p.presentDays,
      absent: acc.absent + p.absentDays,
    }),
    { net: 0, ot: 0, ded: 0, present: 0, absent: 0 },
  );

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3>تقارير شهر {month}</h3>
          <input
            type="month"
            value={store.selectedMonth}
            onChange={(e) => store.setSelectedMonth(e.target.value)}
          />
        </div>
        <div className="grid-stats">
          <div className="stat">
            <div className="label">صافي الرواتب</div>
            <div className="value" style={{ fontSize: '1.2rem' }}>
              {formatMoney(totals.net, store.settings.currency)}
            </div>
          </div>
          <div className="stat">
            <div className="label">أجور الإضافي</div>
            <div className="value" style={{ fontSize: '1.2rem' }}>
              {formatMoney(totals.ot, store.settings.currency)}
            </div>
          </div>
          <div className="stat">
            <div className="label">أيام حضور مجمعة</div>
            <div className="value">{totals.present}</div>
          </div>
          <div className="stat">
            <div className="label">أيام غياب مجمعة</div>
            <div className="value">{totals.absent}</div>
          </div>
        </div>
      </div>

      <div className="layout-2">
        <div className="panel">
          <div className="panel-head">
            <h3>اتجاه الحضور خلال الشهر</h3>
          </div>
          <div className="chart-box" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,198,210,0.15)" />
                <XAxis dataKey="day" tick={{ fill: '#8fb0bd', fontSize: 10 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fill: '#8fb0bd', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#123042',
                    border: '1px solid rgba(140,198,210,0.2)',
                    borderRadius: 10,
                  }}
                />
                <Bar dataKey="present" fill="#2ec4b6" name="حضور" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#f4a261" name="تأخير" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>توزيع صافي الرواتب حسب القسم</h3>
          </div>
          <div className="chart-box" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptPayroll}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {deptPayroll.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatMoney(Number(v), store.settings.currency)}
                  contentStyle={{
                    background: '#123042',
                    border: '1px solid rgba(140,198,210,0.2)',
                    borderRadius: 10,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>أكثر الموظفين تأخيراً / إضافياً</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>دقائق التأخير</th>
                <th>دقائق الإضافي</th>
              </tr>
            </thead>
            <tbody>
              {lateLeaders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty">
                    لا بيانات كافية
                  </td>
                </tr>
              ) : (
                lateLeaders.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td>{r.late}</td>
                    <td>{r.overtime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
