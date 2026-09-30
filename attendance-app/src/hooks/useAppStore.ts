import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AppView,
  AttendanceRecord,
  LeaveDay,
  Profile,
  SalaryAdjustment,
} from '../types';
import {
  calcAttendanceMetrics,
  computeMonthSalary,
  currentMonth,
  leaveDaysInRange,
  nowTime,
  todayISO,
  uid,
} from '../lib/payroll';
import { loadState, resetState, saveState, type AppState } from '../lib/storage';

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<AppView>('home');
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

  const todayRecord = useMemo(
    () => state.attendance.find((a) => a.date === todayISO()),
    [state.attendance],
  );

  const monthSalary = useMemo(
    () =>
      computeMonthSalary(
        state.profile,
        selectedMonth,
        state.attendance,
        state.leaves,
        state.adjustments,
      ),
    [state.profile, state.attendance, state.leaves, state.adjustments, selectedMonth],
  );

  const updateProfile = useCallback(
    (profile: Profile) => {
      setState((s) => ({ ...s, profile }));
      notify('تم حفظ ملفك الشخصي');
    },
    [notify],
  );

  const checkIn = useCallback(
    (time?: string) => {
      const date = todayISO();
      const checkInTime = time || nowTime();
      setState((s) => {
        const existing = s.attendance.find((a) => a.date === date);
        if (existing?.checkIn) return s;
        const metrics = calcAttendanceMetrics(
          s.profile.schedule,
          checkInTime,
          existing?.checkOut,
          s.profile.lateGraceMinutes,
        );
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
          date,
          checkIn: checkInTime,
          ...metrics,
        };
        return { ...s, attendance: [...s.attendance, rec] };
      });
      notify('تم تسجيل حضورك ✓');
    },
    [notify],
  );

  const checkOut = useCallback(
    (time?: string) => {
      const date = todayISO();
      const checkOutTime = time || nowTime();
      setState((s) => {
        const existing = s.attendance.find((a) => a.date === date);
        if (!existing?.checkIn) return s;
        const metrics = calcAttendanceMetrics(
          s.profile.schedule,
          existing.checkIn,
          checkOutTime,
          s.profile.lateGraceMinutes,
        );
        return {
          ...s,
          attendance: s.attendance.map((a) =>
            a.id === existing.id ? { ...a, checkOut: checkOutTime, ...metrics } : a,
          ),
        };
      });
      notify('تم تسجيل انصرافك ✓');
    },
    [notify],
  );

  const saveAttendance = useCallback(
    (rec: AttendanceRecord) => {
      setState((s) => {
        const metrics = calcAttendanceMetrics(
          s.profile.schedule,
          rec.checkIn,
          rec.checkOut,
          s.profile.lateGraceMinutes,
        );
        const full = { ...rec, ...metrics };
        const exists = s.attendance.some((a) => a.id === full.id);
        return {
          ...s,
          attendance: exists
            ? s.attendance.map((a) => (a.id === full.id ? full : a))
            : [...s.attendance, full],
        };
      });
      notify('تم حفظ السجل');
    },
    [notify],
  );

  const deleteAttendance = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, attendance: s.attendance.filter((a) => a.id !== id) }));
      notify('تم حذف السجل');
    },
    [notify],
  );

  const saveLeave = useCallback(
    (leave: Omit<LeaveDay, 'days'> & { days?: number }) => {
      setState((s) => {
        const full: LeaveDay = {
          ...leave,
          days: leave.days ?? leaveDaysInRange(leave.fromDate, leave.toDate, s.profile.schedule),
        };
        const exists = s.leaves.some((l) => l.id === full.id);
        return {
          ...s,
          leaves: exists ? s.leaves.map((l) => (l.id === full.id ? full : l)) : [...s.leaves, full],
        };
      });
      notify('تم حفظ الإجازة');
    },
    [notify],
  );

  const deleteLeave = useCallback(
    (id: string) => {
      setState((s) => ({ ...s, leaves: s.leaves.filter((l) => l.id !== id) }));
      notify('تم حذف الإجازة');
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
      notify('تم حفظ التعديل');
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

  const reset = useCallback(() => {
    setState(resetState());
    notify('تمت إعادة التعيين');
  }, [notify]);

  return {
    ...state,
    view,
    setView,
    selectedMonth,
    setSelectedMonth,
    flash,
    todayRecord,
    monthSalary,
    updateProfile,
    checkIn,
    checkOut,
    saveAttendance,
    deleteAttendance,
    saveLeave,
    deleteLeave,
    saveAdjustment,
    deleteAdjustment,
    reset,
  };
}

export type AppStore = ReturnType<typeof useAppStore>;
