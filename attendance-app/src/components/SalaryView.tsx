import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { AppStore } from '../hooks/useAppStore';
import { formatMinutes, formatMoney, uid } from '../lib/payroll';
import type { SalaryAdjustment } from '../types';
import { Field, Modal } from './ui';

export function SalaryView({ store }: { store: AppStore }) {
  const s = store.monthSalary;
  const [adj, setAdj] = useState<SalaryAdjustment | null>(null);
  const monthAdj = store.adjustments.filter((a) => a.month === store.selectedMonth);

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3>راتبي لشهر {store.selectedMonth}</h3>
          <div className="toolbar">
            <input
              type="month"
              value={store.selectedMonth}
              onChange={(e) => store.setSelectedMonth(e.target.value)}
            />
            <button
              className="btn"
              onClick={() =>
                setAdj({
                  id: uid('adj'),
                  month: store.selectedMonth,
                  type: 'مكافأة',
                  amount: 0,
                  description: '',
                })
              }
            >
              <Plus size={16} /> مكافأة / خصم / سلفة
            </button>
          </div>
        </div>

        <div className="payroll-summary">
          <div className="mini-card">
            <div className="k">إجمالي المستحق</div>
            <div className="v">{formatMoney(s.gross, store.profile.currency)}</div>
          </div>
          <div className="mini-card">
            <div className="k">الخصومات</div>
            <div className="v">{formatMoney(s.totalDeductions, store.profile.currency)}</div>
          </div>
          <div className="mini-card">
            <div className="k">صافي راتبي</div>
            <div className="v" style={{ color: 'var(--accent)' }}>
              {formatMoney(s.netSalary, store.profile.currency)}
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <tbody>
              <tr>
                <td>الراتب الأساسي</td>
                <td>{formatMoney(s.baseSalary, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>بدل السكن</td>
                <td>{formatMoney(s.housingAllowance, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>بدل المواصلات</td>
                <td>{formatMoney(s.transportAllowance, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>بدلات أخرى</td>
                <td>{formatMoney(s.otherAllowance, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>أجر الإضافي ({formatMinutes(s.overtimeMinutes)})</td>
                <td>{formatMoney(s.overtimePay, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>مكافآت</td>
                <td>{formatMoney(s.bonus, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>بدل إضافي</td>
                <td>{formatMoney(s.extraAllowance, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>خصم التأخير</td>
                <td>{formatMoney(s.lateDeduction, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>خصم الغياب</td>
                <td>{formatMoney(s.absenceDeduction, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>خصم إجازة بدون راتب</td>
                <td>{formatMoney(s.unpaidLeaveDeduction, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>سلف</td>
                <td>{formatMoney(s.advanceDeduction, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>خصومات أخرى</td>
                <td>{formatMoney(s.otherDeduction, store.profile.currency)}</td>
              </tr>
              <tr>
                <td>أيام الحضور / الغياب / الإجازة</td>
                <td>
                  {s.presentDays} / {s.absentDays} / {s.leaveDays}
                </td>
              </tr>
              <tr>
                <td>ساعات العمل</td>
                <td>{s.workedHours} ساعة</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>تعديلاتي هذا الشهر</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الوصف</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {monthAdj.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty">
                    لا توجد تعديلات
                  </td>
                </tr>
              ) : (
                monthAdj.map((a) => (
                  <tr key={a.id}>
                    <td>{a.type}</td>
                    <td>{formatMoney(a.amount, store.profile.currency)}</td>
                    <td>{a.description || '—'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => store.deleteAdjustment(a.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adj && (
        <Modal title="تعديل على الراتب" onClose={() => setAdj(null)}>
          <div className="form-grid">
            <Field label="الشهر">
              <input
                type="month"
                value={adj.month}
                onChange={(e) => setAdj({ ...adj, month: e.target.value })}
              />
            </Field>
            <Field label="النوع">
              <select
                value={adj.type}
                onChange={(e) =>
                  setAdj({ ...adj, type: e.target.value as SalaryAdjustment['type'] })
                }
              >
                <option>مكافأة</option>
                <option>بدل إضافي</option>
                <option>سلفة</option>
                <option>خصم</option>
              </select>
            </Field>
            <Field label="المبلغ">
              <input
                type="number"
                value={adj.amount}
                onChange={(e) => setAdj({ ...adj, amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="الوصف" full>
              <input
                value={adj.description}
                onChange={(e) => setAdj({ ...adj, description: e.target.value })}
              />
            </Field>
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setAdj(null)}>
              إلغاء
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                store.saveAdjustment(adj);
                setAdj(null);
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
