import { useMemo, useState } from 'react';
import { Eye, Plus, Printer, Trash2 } from 'lucide-react';
import type { AppStore } from '../hooks/useAppStore';
import { formatMinutes, formatMoney, uid } from '../lib/payroll';
import type { PayrollLine, SalaryAdjustment } from '../types';
import { Field, Modal } from './ui';

export function PayrollView({ store }: { store: AppStore }) {
  const [detail, setDetail] = useState<PayrollLine | null>(null);
  const [adj, setAdj] = useState<SalaryAdjustment | null>(null);

  const totals = useMemo(() => {
    return store.payroll.reduce(
      (acc, p) => ({
        gross: acc.gross + p.gross,
        deductions: acc.deductions + p.totalDeductions,
        net: acc.net + p.netSalary,
        overtime: acc.overtime + p.overtimePay,
      }),
      { gross: 0, deductions: 0, net: 0, overtime: 0 },
    );
  }, [store.payroll]);

  const monthAdjustments = store.adjustments.filter((a) => a.month === store.selectedMonth);

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3>مسير رواتب شهر {store.selectedMonth}</h3>
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
                  employeeId: store.activeEmployees[0]?.id || '',
                  month: store.selectedMonth,
                  type: 'مكافأة',
                  amount: 0,
                  description: '',
                })
              }
            >
              <Plus size={16} /> مكافأة / خصم / سلفة
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} /> طباعة
            </button>
          </div>
        </div>

        <div className="payroll-summary">
          <div className="mini-card">
            <div className="k">إجمالي المستحقات</div>
            <div className="v">{formatMoney(totals.gross, store.settings.currency)}</div>
          </div>
          <div className="mini-card">
            <div className="k">إجمالي الخصومات</div>
            <div className="v">{formatMoney(totals.deductions, store.settings.currency)}</div>
          </div>
          <div className="mini-card">
            <div className="k">صافي الرواتب</div>
            <div className="v" style={{ color: 'var(--accent)' }}>
              {formatMoney(totals.net, store.settings.currency)}
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>القسم</th>
                <th>الأساسي + البدلات</th>
                <th>إضافي</th>
                <th>مكافآت</th>
                <th>الخصومات</th>
                <th>الصافي</th>
                <th>أيام</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {store.payroll.map((p) => (
                <tr key={p.employeeId}>
                  <td>
                    <strong>{p.employeeName}</strong>
                  </td>
                  <td>{p.department}</td>
                  <td>
                    {formatMoney(
                      p.baseSalary + p.housingAllowance + p.transportAllowance + p.otherAllowance,
                      store.settings.currency,
                    )}
                  </td>
                  <td>{formatMoney(p.overtimePay, store.settings.currency)}</td>
                  <td>{formatMoney(p.bonus + p.extraAllowance, store.settings.currency)}</td>
                  <td>{formatMoney(p.totalDeductions, store.settings.currency)}</td>
                  <td>
                    <strong>{formatMoney(p.netSalary, store.settings.currency)}</strong>
                  </td>
                  <td>
                    حضور {p.presentDays} · غياب {p.absentDays} · إجازة {p.leaveDays}
                  </td>
                  <td>
                    <button className="btn btn-sm" onClick={() => setDetail(p)}>
                      <Eye size={14} /> تفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>تعديلات الراتب لهذا الشهر</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الوصف</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {monthAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">
                    لا توجد تعديلات
                  </td>
                </tr>
              ) : (
                monthAdjustments.map((a) => {
                  const emp = store.employees.find((e) => e.id === a.employeeId);
                  return (
                    <tr key={a.id}>
                      <td>{emp?.name}</td>
                      <td>{a.type}</td>
                      <td>{formatMoney(a.amount, store.settings.currency)}</td>
                      <td>{a.description}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => store.deleteAdjustment(a.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <Modal title={`قسيمة راتب — ${detail.employeeName}`} onClose={() => setDetail(null)}>
          <div className="payroll-summary">
            <div className="mini-card">
              <div className="k">الإجمالي</div>
              <div className="v">{formatMoney(detail.gross, store.settings.currency)}</div>
            </div>
            <div className="mini-card">
              <div className="k">الخصومات</div>
              <div className="v">{formatMoney(detail.totalDeductions, store.settings.currency)}</div>
            </div>
            <div className="mini-card">
              <div className="k">الصافي</div>
              <div className="v">{formatMoney(detail.netSalary, store.settings.currency)}</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <tbody>
                <tr>
                  <td>الراتب الأساسي</td>
                  <td>{formatMoney(detail.baseSalary, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>بدل السكن</td>
                  <td>{formatMoney(detail.housingAllowance, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>بدل المواصلات</td>
                  <td>{formatMoney(detail.transportAllowance, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>بدلات أخرى</td>
                  <td>{formatMoney(detail.otherAllowance, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>أجر الإضافي ({formatMinutes(detail.overtimeMinutes)})</td>
                  <td>{formatMoney(detail.overtimePay, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>مكافآت</td>
                  <td>{formatMoney(detail.bonus, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>بدل إضافي</td>
                  <td>{formatMoney(detail.extraAllowance, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>خصم التأخير</td>
                  <td>{formatMoney(detail.lateDeduction, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>خصم الغياب</td>
                  <td>{formatMoney(detail.absenceDeduction, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>خصم إجازة بدون راتب</td>
                  <td>{formatMoney(detail.unpaidLeaveDeduction, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>سلف</td>
                  <td>{formatMoney(detail.advanceDeduction, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>خصومات أخرى</td>
                  <td>{formatMoney(detail.otherDeduction, store.settings.currency)}</td>
                </tr>
                <tr>
                  <td>ساعات العمل</td>
                  <td>{detail.workedHours} ساعة</td>
                </tr>
                <tr>
                  <td>أيام الحضور / الغياب / الإجازة</td>
                  <td>
                    {detail.presentDays} / {detail.absentDays} / {detail.leaveDays}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} /> طباعة القسيمة
            </button>
            <button className="btn" onClick={() => setDetail(null)}>
              إغلاق
            </button>
          </div>
        </Modal>
      )}

      {adj && (
        <Modal title="تعديل على الراتب" onClose={() => setAdj(null)}>
          <div className="form-grid">
            <Field label="الموظف" full>
              <select
                value={adj.employeeId}
                onChange={(e) => setAdj({ ...adj, employeeId: e.target.value })}
              >
                {store.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </Field>
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
