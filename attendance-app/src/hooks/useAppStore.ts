import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AppView,
  AttendanceRecord,
  CompanySettings,
  Employee,
  LeaveRequest,
  PayrollLine,
  SalaryAdjustment,
} from '../types';
import {
  calcAttendanceMetrics,
  computePayroll,
  currentMonth,
  leaveDaysInRange,
  nowTime,
  todayISO,
  uid,
} from '../lib/payroll';
import { loadState, resetState, saveState, type AppState } from '../lib/storage';

export function useAppStore() {
  const [state, setState] = useState<AppState>(() =>
    typeof window !== 'undefined' ? loadState() : loadState(),
  );
  const [view, setView] = useState<AppView>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2800);
    return () => clearTimeout(t);
  }, [flash]);

  const notify = useCallback((msg: string) => setFlash(msg), []);

  const activeEmployees = useMemo(
    () => state.employees.filter((e) => e.status === 'نشط'),
    [state.employees],
  );

  const upsertEmployee = useCallback(
    (emp: Employee) => {
      setState((s) => {
        const exists = s.employees.some((e) => e.id === emp.id);
        return {
          ...s,
          employees: exists
            ? s.employees.map((e) => (e.id === emp.id ? emp : e))
            : [...s.employees, emp],
        };
      });
      notify(emp.id ? 'تم حفظ بيانات الموظف' : 'تمت إضافة الموظف');
    },
    [notify],
  );

  const deleteEmployee = useCallback(
    (id: string) => {
      setState((s) => ({
        ...s,
        employees: s.employees.filter((e) => e.id !== id),
        attendance: s.attendance.filter((a) => a.employeeId !== id),
        leaves: s.leaves.filter((l) => l.employeeId !== id),
        adjustments: s.adjustments.filter((a) => a.employeeId !== id),
      }));
      notify('تم حذف الموظف');
    },
    [notify],
  );

  const checkIn = useCallback(
    (employeeId: string, time?: string) => {
      const emp = state.employees.find((e) => e.id === employeeId);
      if (!emp) return;
      const date = todayISO();
      const checkInTime = time || nowTime();
      setState((s) => {
        const existing = s.attendance.find((a) => a.employeeId === employeeId && a.date === date);
        if (existing?.checkIn) {
          return s;
        }
        const metrics = calcAttendanceMetrics(emp, date, checkInTime, existing?.checkOut, s.settings);
        if (existing) {
          return {
            ...s,
            attendance: s.attendance.map((a) =>
              a.id === existing.id ? { ...a, checkIn: checkInTime, ...metrics } : a,
            ),
          };
        }
        const rec: AttendanceRecord = {
          id: uid('att'),
          employeeId,
          date,
          checkIn: checkInTime,
          ...metrics,
        };
        return { ...s, attendance: [...s.attendance, rec] };
      });
      notify(`تم تسجيل حضور ${emp.name}`);
    },
    [state.employees, notify],
  );

  const checkOut = useCallback(
    (employeeId: string, time?: string) => {
      const emp = state.employees.find((e) => e.id === employeeId);
      if (!emp) return;
      const date = todayISO();
      const checkOutTime = time || nowTime();
      setState((s) => {
        const existing = s.attendance.find((a) => a.employeeId === employeeId && a.date === date);
        if (!existing?.checkIn) return s;
        const metrics = calcAttendanceMetrics(emp, date, existing.checkIn, checkOutTime, s.settings);
        return {
          ...s,
          attendance: s.attendance.map((a) =>
            a.id === existing.id ? { ...a, checkOut: checkOutTime, ...metrics } : a,
          ),
        };
      });
      notify(`تم تسجيل انصراف ${emp.name}`);
    },
    [state.employees, notify],
  );

  const saveAttendance = useCallback(
    (rec: AttendanceRecord) => {
      const emp = state.employees.find((e) => e.id === rec.employeeId);
      if (!emp) return;
      const metrics = calcAttendanceMetrics(
        emp,
        rec.date,
        rec.checkIn,
        rec.checkOut,
        state.settings,
      );
      const full = { ...rec, ...metrics };
      setState((s) => {
        const exists = s.attendance.some((a) => a.id === full.id);
        return {
          ...s,
          attendance: exists
            ? s.attendance.map((a) => (a.id === full.id ? full : a))
            : [...s.attendance, full],
        };
      });
      notify('تم حفظ سجل الحضور');
    },
    [state.employees, state.settings, notify],
  );

  const deleteAttendance = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, attendance: s.attendance.filter((a) => a.id !== id) }));
      notify('تم حذف السجل');
    },
    [notify],
  );

  const saveLeave = useCallback(
    (leave: Omit<LeaveRequest, 'days' | 'createdAt'> & { days?: number; createdAt?: string }) => {
      const emp = state.employees.find((e) => e.id === leave.employeeId);
      const days =
        leave.days ??
        leaveDaysInRange(leave.fromDate, leave.toDate, emp?.schedule);
      const full: LeaveRequest = {
        ...leave,
        days,
        createdAt: leave.createdAt || todayISO(),
      };
      setState((s) => {
        const exists = s.leaves.some((l) => l.id === full.id);
        return {
          ...s,
          leaves: exists ? s.leaves.map((l) => (l.id === full.id ? full : l)) : [...s.leaves, full],
        };
      });
      notify('تم حفظ طلب الإجازة');
    },
    [state.employees, notify],
  );

  const deleteLeave = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, leaves: s.leaves.filter((l) => l.id !== id) }));
      notify('تم حذف طلب الإجازة');
    },
    [notify],
  );

  const saveAdjustment = useCallback(
    (adj: SalaryAdjustment) => {
      setState((s) => {
        const exists = s.adjustments.some((a) => a.id === adj.id);
        return {
          ...s,
          adjustments: exists
            ? s.adjustments.map((a) => (a.id === adj.id ? adj : a))
            : [...s.adjustments, adj],
        };
      });
      notify('تم حفظ التعديل على الراتب');
    },
    [notify],
  );

  const deleteAdjustment = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, adjustments: s.adjustments.filter((a) => a.id !== id) }));
      notify('تم حذف التعديل');
    },
    [notify],
  );

  const updateSettings = useCallback(
    (settings: CompanySettings) => {
      setState((s) => ({ ...s, settings }));
      notify('تم حفظ الإعدادات');
    },
    [notify],
  );

  const payroll: PayrollLine[] = useMemo(
    () =>
      activeEmployees.map((emp) =>
        computePayroll(
          emp,
          selectedMonth,
          state.attendance,
          state.leaves,
          state.adjustments,
          state.settings,
        ),
      ),
    [
      activeEmployees,
      selectedMonth,
      state.attendance,
      state.leaves,
      state.adjustments,
      state.settings,
    ],
  );

  const reset = useCallback(() => {
    setState(resetState());
    notify('تمت إعادة تعيين البيانات التجريبية');
  }, [notify]);

  return {
    ...state,
    view,
    setView,
    selectedMonth,
    setSelectedMonth,
    flash,
    activeEmployees,
    payroll,
    upsertEmployee,
    deleteEmployee,
    checkIn,
    checkOut,
    saveAttendance,
    deleteAttendance,
    saveLeave,
    deleteLeave,
    saveAdjustment,
    deleteAdjustment,
    updateSettings,
    reset,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
