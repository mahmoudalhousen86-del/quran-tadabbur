import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { AppStore } from '../hooks/useAppStore';
import { formatMinutes, todayISO, uid } from '../lib/payroll';
import type { AttendanceRecord } from '../types';
import { Field, Modal, StatusBadge } from './ui';

export function AttendanceView({ store }: { store: AppStore }) {
  const [month, setMonth] = useState(store.selectedMonth);
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);

  const rows = useMemo(
    () =>
      [...store.attendance]
        .filter((a) => a.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [store.attendance, month],
  );

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3>سجل حضوري</h3>
          <div className="toolbar">
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <button
              className="btn btn-primary"
              onClick={() =>
                setEditing({
                  id: uid('att'),
                  date: todayISO(),
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
              <Plus size={16} /> إضافة يوم
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>حضور</th>
                <th>انصراف</th>
                <th>العمل</th>
                <th>تأخير</th>
                <th>إضافي</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    لا توجد سجلات لهذا الشهر
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{r.checkIn || '—'}</td>
                    <td>{r.checkOut || '—'}</td>
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
        <Modal title="سجل يوم" onClose={() => setEditing(null)}>
          <div className="form-grid">
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
