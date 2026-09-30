import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { AppStore } from '../hooks/useAppStore';
import { leaveDaysInRange, todayISO, uid } from '../lib/payroll';
import type { LeaveDay, LeaveType } from '../types';
import { Field, Modal } from './ui';

export function LeavesView({ store }: { store: AppStore }) {
  const [editing, setEditing] = useState<LeaveDay | null>(null);
  const rows = useMemo(
    () => [...store.leaves].sort((a, b) => b.fromDate.localeCompare(a.fromDate)),
    [store.leaves],
  );

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3>إجازاتي</h3>
          <button
            className="btn btn-primary"
            onClick={() =>
              setEditing({
                id: uid('leave'),
                type: 'اعتيادي',
                fromDate: todayISO(),
                toDate: todayISO(),
                days: 1,
                reason: '',
              })
            }
          >
            <Plus size={16} /> إضافة إجازة
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>النوع</th>
                <th>من</th>
                <th>إلى</th>
                <th>الأيام</th>
                <th>السبب</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    لا توجد إجازات مسجلة
                  </td>
                </tr>
              ) : (
                rows.map((l) => (
                  <tr key={l.id}>
                    <td>{l.type}</td>
                    <td>{l.fromDate}</td>
                    <td>{l.toDate}</td>
                    <td>{l.days}</td>
                    <td>{l.reason || '—'}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-sm" onClick={() => setEditing({ ...l })}>
                          تعديل
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => store.deleteLeave(l.id)}
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
        <Modal title="إجازة" onClose={() => setEditing(null)}>
          <div className="form-grid">
            <Field label="النوع">
              <select
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as LeaveType })}
              >
                <option>اعتيادي</option>
                <option>مرضي</option>
                <option>طارئ</option>
                <option>بدون راتب</option>
              </select>
            </Field>
            <Field label="من">
              <input
                type="date"
                value={editing.fromDate}
                onChange={(e) => setEditing({ ...editing, fromDate: e.target.value })}
              />
            </Field>
            <Field label="إلى">
              <input
                type="date"
                value={editing.toDate}
                onChange={(e) => setEditing({ ...editing, toDate: e.target.value })}
              />
            </Field>
            <Field label="السبب" full>
              <textarea
                value={editing.reason}
                onChange={(e) => setEditing({ ...editing, reason: e.target.value })}
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
                store.saveLeave({
                  ...editing,
                  days: leaveDaysInRange(
                    editing.fromDate,
                    editing.toDate,
                    store.profile.schedule,
                  ),
                });
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
