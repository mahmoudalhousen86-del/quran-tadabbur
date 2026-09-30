import type { AttendanceRecord, LeaveDay, Profile, SalaryAdjustment } from '../types';
import { calcAttendanceMetrics, todayISO, uid } from './payroll';

const KEY = 'personal_attendance_v1';

export interface AppState {
  profile: Profile;
  attendance: AttendanceRecord[];
  leaves: LeaveDay[];
  adjustments: SalaryAdjustment[];
}

export function defaultProfile(): Profile {
  return {
    name: 'أنا',
    jobTitle: 'موظف',
    workplace: 'مكان العمل',
    baseSalary: 10000,
    housingAllowance: 1500,
    transportAllowance: 800,
    otherAllowance: 200,
    overtimeRate: 1.5,
    schedule: {
      startTime: '09:00',
      endTime: '17:00',
      workDays: [0, 1, 2, 3, 4],
      dailyHours: 8,
    },
    currency: 'ر.س',
    lateGraceMinutes: 10,
    lateDeductionPerMinute: 0,
    absenceDeductionDays: true,
    unpaidLeaveDeduct: true,
  };
}

export function createSeedState(): AppState {
  const profile = defaultProfile();
  const today = todayISO();
  const metrics = calcAttendanceMetrics(profile.schedule, '08:55', undefined, profile.lateGraceMinutes);
  return {
    profile,
    attendance: [
      {
        id: uid('att'),
        date: today,
        checkIn: '08:55',
        ...metrics,
      },
    ],
    leaves: [],
    adjustments: [],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seed = createSeedState();
      saveState(seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as AppState;
    // migrate away from old multi-employee storage
    if (!parsed.profile) {
      const seed = createSeedState();
      saveState(seed);
      return seed;
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  localStorage.removeItem('attendance_payroll_v1');
  const seed = createSeedState();
  saveState(seed);
  return seed;
}
