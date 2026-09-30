import { useState } from 'react';
import type { AppStore } from '../hooks/useAppStore';
import type { CompanySettings } from '../types';
import { Field } from './ui';

const DAY_LABELS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export function SettingsView({ store }: { store: AppStore }) {
  const [form, setForm] = useState<CompanySettings>(store.settings);

  const toggleWorkDay = (day: number) => {
    const days = form.defaultWorkDays.includes(day)
      ? form.defaultWorkDays.filter((d) => d !== day)
      : [...form.defaultWorkDays, day].sort();
    setForm({ ...form, defaultWorkDays: days });
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>إعدادات النظام والشركة</h3>
      </div>
      <div className="form-grid">
        <Field label="اسم الشركة" full>
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
        </Field>
        <Field label="العملة">
          <input
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />
        </Field>
        <Field label="سماحية التأخير (دقيقة)">
          <input
            type="number"
            value={form.lateGraceMinutes}
            onChange={(e) => setForm({ ...form, lateGraceMinutes: Number(e.target.value) })}
          />
        </Field>
        <Field label="خصم التأخير لكل دقيقة (0 = حسب الساعة)">
          <input
            type="number"
            value={form.lateDeductionPerMinute}
            onChange={(e) =>
              setForm({ ...form, lateDeductionPerMinute: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="بداية الدوام الافتراضية">
          <input
            type="time"
            value={form.defaultStartTime}
            onChange={(e) => setForm({ ...form, defaultStartTime: e.target.value })}
          />
        </Field>
        <Field label="نهاية الدوام الافتراضية">
          <input
            type="time"
            value={form.defaultEndTime}
            onChange={(e) => setForm({ ...form, defaultEndTime: e.target.value })}
          />
        </Field>
        <Field label="ساعات العمل اليومية">
          <input
            type="number"
            value={form.defaultDailyHours}
            onChange={(e) => setForm({ ...form, defaultDailyHours: Number(e.target.value) })}
          />
        </Field>
        <Field label="خصم الغياب يومياً من الراتب">
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
        <Field label="خصم الإجازة بدون راتب">
          <select
            value={form.unpaidLeaveDeduct ? '1' : '0'}
            onChange={(e) => setForm({ ...form, unpaidLeaveDeduct: e.target.value === '1' })}
          >
            <option value="1">نعم</option>
            <option value="0">لا</option>
          </select>
        </Field>
        <Field label="أيام العمل الافتراضية" full>
          <div className="chips">
            {DAY_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                className={`chip ${form.defaultWorkDays.includes(i) ? 'on' : ''}`}
                onClick={() => toggleWorkDay(i)}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
        <button className="btn btn-danger" onClick={() => store.reset()}>
          إعادة تعيين البيانات التجريبية
        </button>
        <button className="btn btn-primary" onClick={() => store.updateSettings(form)}>
          حفظ الإعدادات
        </button>
      </div>

      <div className="panel" style={{ marginTop: '1rem', marginBottom: 0 }}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--display)' }}>كيف يُحسب الراتب؟</h3>
        <ul style={{ color: 'var(--muted)', paddingInlineStart: '1.2rem', margin: 0 }}>
          <li>الإجمالي = الأساسي + بدل السكن + المواصلات + بدلات أخرى + أجر الإضافي + المكافآت</li>
          <li>أجر الساعة = الأساسي ÷ (ساعات اليوم × أيام العمل الأسبوعية × 4.33)</li>
          <li>أجر الإضافي = ساعات الإضافي × أجر الساعة × معامل الإضافي للموظف</li>
          <li>خصم الغياب / الإجازة بدون راتب = (الأساسي ÷ أيام العمل بالشهر) × عدد الأيام</li>
          <li>خصم التأخير حسب السماحية ثم بالدقيقة أو بأجر الساعة</li>
          <li>الصافي = الإجمالي − كل الخصومات والسلف</li>
        </ul>
      </div>
    </div>
  );
}
