import { useMemo, useState } from 'react';
import { LogIn, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import type { AppStore } from '../hooks/useAppStore';
import { formatMinutes, todayISO, uid } from '../lib/payroll';
import type { AttendanceRecord } from '../types';
import { Field, Modal, StatusBadge } from './ui';

export function AttendanceView({ store }: { store: AppStore }) {
  const [date, setDate] = useState(todayISO());
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  const rows = useMemo(
    () =>
      store.attendance
        .filter((a) => a.date === date)
        .map((a) => ({
          ...a,
          employee: store.employees.find((e) => e.id === a.employeeId),
        }))
        .sort((a, b) => (a.employee?.name || '').localeCompare(b.employee?.name || '', 'ar')),
    [store.attendance, store.employees, date],
  );

  const missing = store.activeEmployees.filter(
    (e) => !rows.some((r) => r.employeeId === e.id),
  );

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3>سجل الحضور ليوم {date}</h3>
          <div className="toolbar">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <button
              className="btn btn-primary"
              onClick={() =>
                setEditing({
                  id: uid('att'),
                  employeeId: store.activeEmployees[0]?.id || '',
                  date,
                  checkIn: '09:00',
                  checkOut: '17:00',
                  lateMinutes: 0,
                  earlyLeaveMinutes: 0,
                  overtimeMinutes: 0,
                  workedMinutes: 0,
                  status: 'حاضر',
                })
              }
            >
              <Plus size={16} /> سجل يدوي
            </button>
          </div>
        </div>

        {date === todayISO() && missing.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="panel-head">
              <h3>تسجيل حضور سريع لمن لم يسجلوا</h3>
            </div>
            <div className="quick-list">
              {missing.map((emp) => (
                <div className="quick-item" key={emp.id}>
                  <div>
                    <strong>{emp.name}</strong>
                    <span>{emp.department}</span>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => store.checkIn(emp.id)}>
                    <LogIn size={14} /> حضور الآن
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>حضور</th>
                <th>انصراف</th>
                <th>ساعات العمل</th>
                <th>تأخير</th>
                <th>إضافي</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    لا توجد سجلات لهذا اليوم
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.employee?.name || '—'}</strong>
                    </td>
                    <td>{r.checkIn || '—'}</td>
                    <td>
                      {r.checkOut ||
                        (date === todayISO() && r.checkIn ? (
                          <button
                            className="btn btn-accent btn-sm"
                            onClick={() => store.checkOut(r.employeeId)}
                          >
                            <LogOut size={14} /> انصراف
                          </button>
                        ) : (
                          '—'
                        ))}
                    </td>
                    <td>{formatMinutes(r.workedMinutes)}</td>
                    <td>{formatMinutes(r.lateMinutes)}</td>
                    <td>{formatMinutes(r.overtimeMinutes)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-sm" onClick={() => setEditing({ ...r })}>
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => store.deleteAttendance(r.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title="سجل حضور" onClose={() => setEditing(null)}>
          <div className="form-grid">
            <Field label="الموظف" full>
              <select
                value={editing.employeeId}
                onChange={(e) => setEditing({ ...editing, employeeId: e.target.value })}
              >
                {store.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="التاريخ">
              <input
                type="date"
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              />
            </Field>
            <Field label="وقت الحضور">
              <input
                type="time"
                value={editing.checkIn || ''}
                onChange={(e) => setEditing({ ...editing, checkIn: e.target.value })}
              />
            </Field>
            <Field label="وقت الانصراف">
              <input
                type="time"
                value={editing.checkOut || ''}
                onChange={(e) =>
                  setEditing({ ...editing, checkOut: e.target.value || undefined })
                }
              />
            </Field>
            <Field label="ملاحظة" full>
              <input
                value={editing.note || ''}
                onChange={(e) => setEditing({ ...editing, note: e.target.value })}
              />
            </Field>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setEditing(null)}>
              إلغاء
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                store.saveAttendance(editing);
                setEditing(null);
              }}
            >
              حفظ
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
