import { useState } from 'react';
import type { AppStore } from '../hooks/useAppStore';
import type { Profile } from '../types';
import { Field } from './ui';

const DAY_LABELS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function SettingsView({ store }: { store: AppStore }) {
  const [form, setForm] = useState<Profile>(store.profile);

  const toggleDay = (day: number) => {
    const days = form.schedule.workDays.includes(day)
      ? form.schedule.workDays.filter((d) => d !== day)
      : [...form.schedule.workDays, day].sort();
    setForm({ ...form, schedule: { ...form.schedule, workDays: days } });
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>ملفي الشخصي وإعدادات الدوام</h3>
      </div>
      <div className="form-grid">
        <Field label="اسمي">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="المسمى الوظيفي">
          <input
            value={form.jobTitle}
            onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
          />
        </Field>
        <Field label="مكان العمل" full>
          <input
            value={form.workplace}
            onChange={(e) => setForm({ ...form, workplace: e.target.value })}
          />
        </Field>
        <Field label="راتبي الأساسي">
          <input
            type="number"
            value={form.baseSalary}
            onChange={(e) => setForm({ ...form, baseSalary: Number(e.target.value) })}
          />
        </Field>
        <Field label="بدل السكن">
          <input
            type="number"
            value={form.housingAllowance}
            onChange={(e) => setForm({ ...form, housingAllowance: Number(e.target.value) })}
          />
        </Field>
        <Field label="بدل المواصلات">
          <input
            type="number"
            value={form.transportAllowance}
            onChange={(e) => setForm({ ...form, transportAllowance: Number(e.target.value) })}
          />
        </Field>
        <Field label="بدلات أخرى">
          <input
            type="number"
            value={form.otherAllowance}
            onChange={(e) => setForm({ ...form, otherAllowance: Number(e.target.value) })}
          />
        </Field>
        <Field label="العملة">
          <input
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />
        </Field>
        <Field label="معامل الإضافي">
          <input
            type="number"
            step="0.25"
            value={form.overtimeRate}
            onChange={(e) => setForm({ ...form, overtimeRate: Number(e.target.value) })}
          />
        </Field>
        <Field label="بداية دوامي">
          <input
            type="time"
            value={form.schedule.startTime}
            onChange={(e) =>
              setForm({ ...form, schedule: { ...form.schedule, startTime: e.target.value } })
            }
          />
        </Field>
        <Field label="نهاية دوامي">
          <input
            type="time"
            value={form.schedule.endTime}
            onChange={(e) =>
              setForm({ ...form, schedule: { ...form.schedule, endTime: e.target.value } })
            }
          />
        </Field>
        <Field label="ساعات اليوم">
          <input
            type="number"
            value={form.schedule.dailyHours}
            onChange={(e) =>
              setForm({
                ...form,
                schedule: { ...form.schedule, dailyHours: Number(e.target.value) },
              })
            }
          />
        </Field>
        <Field label="سماحية التأخير (دقيقة)">
          <input
            type="number"
            value={form.lateGraceMinutes}
            onChange={(e) => setForm({ ...form, lateGraceMinutes: Number(e.target.value) })}
          />
        </Field>
        <Field label="خصم الغياب يومياً">
          <select
            value={form.absenceDeductionDays ? '1' : '0'}
            onChange={(e) =>
              setForm({ ...form, absenceDeductionDays: e.target.value === '1' })
            }
          >
            <option value="1">نعم</option>
            <option value="0">لا</option>
          </select>
        </Field>
        <Field label="أيام دوامي" full>
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
      <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
        <button className="btn btn-danger" onClick={() => store.reset()}>
          مسح بياناتي وإعادة البدء
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            store.updateProfile(form);
          }}
        >
          حفظ ملفي
        </button>
      </div>
    </div>
  );
}
