import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { AppStore } from '../hooks/useAppStore';
import { formatMoney, uid } from '../lib/payroll';
import type { Department, Employee, EmploymentStatus } from '../types';
import { Field, Modal, StatusBadge } from './ui';

const DEPARTMENTS: Department[] = [
  'الإدارة',
  'الموارد البشرية',
  'المالية',
  'المبيعات',
  'التقنية',
  'العمليات',
  'خدمة العملاء',
];

const DAY_LABELS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

function emptyEmployee(settings: AppStore['settings']): Employee {
  return {
    id: uid('emp'),
    code: `E-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    nationalId: '',
    phone: '',
    email: '',
    department: 'التقنية',
    jobTitle: '',
    hireDate: new Date().toISOString().slice(0, 10),
    status: 'نشط',
    baseSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowance: 0,
    overtimeRate: 1.5,
    schedule: {
      startTime: settings.defaultStartTime,
      endTime: settings.defaultEndTime,
      workDays: [...settings.defaultWorkDays],
      dailyHours: settings.defaultDailyHours,
    },
  };
}

export function EmployeesView({ store }: { store: AppStore }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Employee | null>(null);

  const list = useMemo(() => {
    const term = q.trim();
    return store.employees.filter(
      (e) =>
        !term ||
        e.name.includes(term) ||
        e.code.includes(term) ||
        e.department.includes(term) ||
        e.jobTitle.includes(term),
    );
  }, [store.employees, q]);

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h3>قائمة الموظفين ({list.length})</h3>
          <div className="toolbar">
            <input
              placeholder="بحث بالاسم أو الرقم أو القسم..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="btn btn-primary" onClick={() => setEditing(emptyEmployee(store.settings))}>
              <Plus size={16} /> موظف جديد
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الرمز</th>
                <th>الاسم</th>
                <th>القسم</th>
                <th>المسمى</th>
                <th>الراتب الأساسي</th>
                <th>البدلات</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td>{e.code}</td>
                  <td>
                    <strong>{e.name}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{e.phone}</div>
                  </td>
                  <td>{e.department}</td>
                  <td>{e.jobTitle}</td>
                  <td>{formatMoney(e.baseSalary, store.settings.currency)}</td>
                  <td>
                    {formatMoney(
                      e.housingAllowance + e.transportAllowance + e.otherAllowance,
                      store.settings.currency,
                    )}
                  </td>
                  <td>
                    <StatusBadge status={e.status} />
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm" onClick={() => setEditing({ ...e })}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => store.deleteEmployee(e.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EmployeeModal
          employee={editing}
          onClose={() => setEditing(null)}
          onSave={(emp) => {
            store.upsertEmployee(emp);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function EmployeeModal({
  employee,
  onClose,
  onSave,
}: {
  employee: Employee;
  onClose: () => void;
  onSave: (e: Employee) => void;
}) {
  const [form, setForm] = useState(employee);
  const set = <K extends keyof Employee>(key: K, value: Employee[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleDay = (day: number) => {
    const days = form.schedule.workDays.includes(day)
      ? form.schedule.workDays.filter((d) => d !== day)
      : [...form.schedule.workDays, day].sort();
    setForm((f) => ({ ...f, schedule: { ...f.schedule, workDays: days } }));
  };

  return (
    <Modal title={employee.name ? `تعديل: ${employee.name}` : 'إضافة موظف'} onClose={onClose} wide>
      <div className="form-grid cols-3">
        <Field label="الرمز">
          <input value={form.code} onChange={(e) => set('code', e.target.value)} />
        </Field>
        <Field label="الاسم الكامل">
          <input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="رقم الهوية">
          <input value={form.nationalId} onChange={(e) => set('nationalId', e.target.value)} />
        </Field>
        <Field label="الجوال">
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="البريد">
          <input value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="تاريخ التعيين">
          <input type="date" value={form.hireDate} onChange={(e) => set('hireDate', e.target.value)} />
        </Field>
        <Field label="القسم">
          <select
            value={form.department}
            onChange={(e) => set('department', e.target.value as Department)}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="المسمى الوظيفي">
          <input value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
        </Field>
        <Field label="الحالة">
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as EmploymentStatus)}
          >
            <option>نشط</option>
            <option>موقوف</option>
            <option>منتهي</option>
          </select>
        </Field>
        <Field label="الراتب الأساسي">
          <input
            type="number"
            value={form.baseSalary}
            onChange={(e) => set('baseSalary', Number(e.target.value))}
          />
        </Field>
        <Field label="بدل سكن">
          <input
            type="number"
            value={form.housingAllowance}
            onChange={(e) => set('housingAllowance', Number(e.target.value))}
          />
        </Field>
        <Field label="بدل مواصلات">
          <input
            type="number"
            value={form.transportAllowance}
            onChange={(e) => set('transportAllowance', Number(e.target.value))}
          />
        </Field>
        <Field label="بدلات أخرى">
          <input
            type="number"
            value={form.otherAllowance}
            onChange={(e) => set('otherAllowance', Number(e.target.value))}
          />
        </Field>
        <Field label="معامل الإضافي">
          <input
            type="number"
            step="0.25"
            value={form.overtimeRate}
            onChange={(e) => set('overtimeRate', Number(e.target.value))}
          />
        </Field>
        <Field label="ساعات العمل اليومية">
          <input
            type="number"
            value={form.schedule.dailyHours}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                schedule: { ...f.schedule, dailyHours: Number(e.target.value) },
              }))
            }
          />
        </Field>
        <Field label="بداية الدوام">
          <input
            type="time"
            value={form.schedule.startTime}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                schedule: { ...f.schedule, startTime: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="نهاية الدوام">
          <input
            type="time"
            value={form.schedule.endTime}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                schedule: { ...f.schedule, endTime: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="أيام العمل" full>
          <div className="chips">
            {DAY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                className={`chip ${form.schedule.workDays.includes(i) ? 'on' : ''}`}
                onClick={() => toggleDay(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          إلغاء
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!form.name.trim()) return;
            onSave(form);
          }}
        >
          حفظ
        </button>
      </div>
    </Modal>
  );
}
