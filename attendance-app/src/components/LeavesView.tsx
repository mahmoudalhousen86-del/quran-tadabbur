import { useMemo, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import type { AppStore } from '../hooks/useAppStore';
import { leaveDaysInRange, todayISO, uid } from '../lib/payroll';
import type { LeaveRequest, LeaveStatus, LeaveType } from '../types';
import { Field, Modal, StatusBadge } from './ui';

export function LeavesView({ store }: { store: AppStore }) {
  const [editing, setEditing] = useState<LeaveRequest | null>(null);

  const rows = useMemo(
    () =>
      [...store.leaves].sort((a, b) => b.fromDate.localeCompare(a.fromDate)),
    [store.leaves],
  );

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3>طلبات الإجازات</h3>
          <button
            className="btn btn-primary"
            onClick={() =>
              setEditing({
                id: uid('leave'),
                employeeId: store.activeEmployees[0]?.id || '',
                type: 'اعتيادي',
                fromDate: todayISO(),
                toDate: todayISO(),
                days: 1,
                reason: '',
                status: 'معلق',
                createdAt: todayISO(),
              })
            }
          >
            <Plus size={16} /> طلب إجازة
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>النوع</th>
                <th>من</th>
                <th>إلى</th>
                <th>الأيام</th>
                <th>السبب</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    لا توجد إجازات
                  </td>
                </tr>
              ) : (
                rows.map((l) => {
                  const emp = store.employees.find((e) => e.id === l.employeeId);
                  return (
                    <tr key={l.id}>
                      <td>{emp?.name}</td>
                      <td>{l.type}</td>
                      <td>{l.fromDate}</td>
                      <td>{l.toDate}</td>
                      <td>{l.days}</td>
                      <td>{l.reason || '—'}</td>
                      <td>
                        <StatusBadge status={l.status} />
                      </td>
                      <td>
                        <div className="actions">
                          {l.status === 'معلق' && (
                            <>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => store.saveLeave({ ...l, status: 'موافق' })}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => store.saveLeave({ ...l, status: 'مرفوض' })}
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title="طلب إجازة" onClose={() => setEditing(null)}>
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
            <Field label="الحالة">
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as LeaveStatus })
                }
              >
                <option>معلق</option>
                <option>موافق</option>
                <option>مرفوض</option>
              </select>
            </Field>
            <Field label="من تاريخ">
              <input
                type="date"
                value={editing.fromDate}
                onChange={(e) => setEditing({ ...editing, fromDate: e.target.value })}
              />
            </Field>
            <Field label="إلى تاريخ">
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
                const emp = store.employees.find((e) => e.id === editing.employeeId);
                store.saveLeave({
                  ...editing,
                  days: leaveDaysInRange(editing.fromDate, editing.toDate, emp?.schedule),
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
