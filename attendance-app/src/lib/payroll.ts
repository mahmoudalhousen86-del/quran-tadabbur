import {
  format,
  parseISO,
  eachDayOfInterval,
  getDay,
  isValid,
} from 'date-fns';
import type {
  AttendanceRecord,
  LeaveDay,
  MonthSalary,
  Profile,
  SalaryAdjustment,
  WorkSchedule,
} from '../types';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function formatMoney(amount: number, currency = 'ر.س'): string {
  return `${amount.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ${currency}`;
}

export function formatMinutes(mins: number): string {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.abs(mins) % 60;
  if (h === 0) return `${m} د`;
  return `${h} س ${m} د`;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function nowTime(): string {
  return format(new Date(), 'HH:mm');
}

export function monthDays(month: string): string[] {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
}

export function isWorkDay(date: string, schedule: WorkSchedule): boolean {
  const d = parseISO(date);
  if (!isValid(d)) return false;
  return schedule.workDays.includes(getDay(d));
}

export function leaveDaysInRange(fromDate: string, toDate: string, schedule?: WorkSchedule): number {
  const from = parseISO(fromDate);
  const to = parseISO(toDate);
  if (!isValid(from) || !isValid(to) || to < from) return 0;
  const days = eachDayOfInterval({ start: from, end: to });
  if (!schedule) return days.length;
  return days.filter((d) => schedule.workDays.includes(getDay(d))).length;
}

export function calcAttendanceMetrics(
  schedule: WorkSchedule,
  checkIn: string | undefined,
  checkOut: string | undefined,
  graceMinutes: number,
): Pick<
  AttendanceRecord,
  'lateMinutes' | 'earlyLeaveMinutes' | 'overtimeMinutes' | 'workedMinutes' | 'status'
> {
  if (!checkIn) {
    return {
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      workedMinutes: 0,
      status: 'غائب',
    };
  }

  const start = parseTimeToMinutes(schedule.startTime);
  const end = parseTimeToMinutes(schedule.endTime);
  const inM = parseTimeToMinutes(checkIn);
  const lateMinutes = Math.max(0, inM - start - graceMinutes);

  let earlyLeaveMinutes = 0;
  let overtimeMinutes = 0;
  let workedMinutes = 0;
  let status: AttendanceRecord['status'] = lateMinutes > 0 ? 'متأخر' : 'حاضر';

  if (checkOut) {
    const outM = parseTimeToMinutes(checkOut);
    workedMinutes = Math.max(0, outM - inM);
    earlyLeaveMinutes = Math.max(0, end - outM);
    const expected = schedule.dailyHours * 60;
    overtimeMinutes = Math.max(0, workedMinutes - expected);
    if (earlyLeaveMinutes > 0) status = 'انصراف مبكر';
    else if (lateMinutes > 0) status = 'متأخر';
    else status = 'حاضر';
  } else {
    status = 'ناقص';
  }

  return { lateMinutes, earlyLeaveMinutes, overtimeMinutes, workedMinutes, status };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function hourlyRate(profile: Profile): number {
  const monthlyHours = profile.schedule.dailyHours * profile.schedule.workDays.length * 4.33;
  return profile.baseSalary / Math.max(monthlyHours, 1);
}

export function dailyRate(profile: Profile, month: string): number {
  const days = monthDays(month).filter((d) => isWorkDay(d, profile.schedule));
  return profile.baseSalary / Math.max(days.length, 1);
}

export function computeMonthSalary(
  profile: Profile,
  month: string,
  attendance: AttendanceRecord[],
  leaves: LeaveDay[],
  adjustments: SalaryAdjustment[],
): MonthSalary {
  const days = monthDays(month);
  const workDates = days.filter((d) => isWorkDay(d, profile.schedule));
  const monthAtt = attendance.filter((a) => a.date.startsWith(month));

  const leaveDateSet = new Set<string>();
  const unpaidLeaveDates = new Set<string>();
  for (const leave of leaves) {
    if (!isValid(parseISO(leave.fromDate)) || !isValid(parseISO(leave.toDate))) continue;
    const range = eachDayOfInterval({
      start: parseISO(leave.fromDate),
      end: parseISO(leave.toDate),
    });
    for (const d of range) {
      const iso = format(d, 'yyyy-MM-dd');
      if (!iso.startsWith(month)) continue;
      if (!isWorkDay(iso, profile.schedule)) continue;
      leaveDateSet.add(iso);
      if (leave.type === 'بدون راتب') unpaidLeaveDates.add(iso);
    }
  }

  let presentDays = 0;
  let lateCount = 0;
  let overtimeMinutes = 0;
  let lateMinutes = 0;
  let workedMinutes = 0;

  for (const a of monthAtt) {
    if (a.checkIn) {
      presentDays += 1;
      overtimeMinutes += a.overtimeMinutes;
      lateMinutes += a.lateMinutes;
      workedMinutes += a.workedMinutes;
      if (a.lateMinutes > 0) lateCount += 1;
    }
  }

  const presentOrLeave = new Set([
    ...monthAtt.filter((a) => a.checkIn).map((a) => a.date),
    ...leaveDateSet,
  ]);
  // Personal mode: count absence only after the user started tracking this month.
  const hasTracking = monthAtt.some((a) => a.checkIn);
  const personalAbsent = hasTracking
    ? workDates.filter((d) => d <= todayISO() && !presentOrLeave.has(d)).length
    : 0;

  const rateH = hourlyRate(profile);
  const rateD = dailyRate(profile, month);
  const overtimePay = (overtimeMinutes / 60) * rateH * profile.overtimeRate;
  const lateDeduction =
    profile.lateDeductionPerMinute > 0
      ? lateMinutes * profile.lateDeductionPerMinute
      : (lateMinutes / 60) * rateH;

  const absenceDeduction = profile.absenceDeductionDays ? personalAbsent * rateD : 0;
  const unpaidLeaveDeduction = profile.unpaidLeaveDeduct ? unpaidLeaveDates.size * rateD : 0;

  const monthAdj = adjustments.filter((a) => a.month === month);
  const bonus = monthAdj.filter((a) => a.type === 'مكافأة').reduce((s, a) => s + a.amount, 0);
  const extraAllowance = monthAdj.filter((a) => a.type === 'بدل إضافي').reduce((s, a) => s + a.amount, 0);
  const advanceDeduction = monthAdj.filter((a) => a.type === 'سلفة').reduce((s, a) => s + a.amount, 0);
  const otherDeduction = monthAdj.filter((a) => a.type === 'خصم').reduce((s, a) => s + a.amount, 0);

  const gross =
    profile.baseSalary +
    profile.housingAllowance +
    profile.transportAllowance +
    profile.otherAllowance +
    overtimePay +
    bonus +
    extraAllowance;

  const totalDeductions =
    lateDeduction + absenceDeduction + unpaidLeaveDeduction + advanceDeduction + otherDeduction;

  return {
    month,
    baseSalary: round2(profile.baseSalary),
    housingAllowance: round2(profile.housingAllowance),
    transportAllowance: round2(profile.transportAllowance),
    otherAllowance: round2(profile.otherAllowance),
    overtimePay: round2(overtimePay),
    overtimeMinutes,
    bonus: round2(bonus),
    extraAllowance: round2(extraAllowance),
    lateDeduction: round2(lateDeduction),
    absenceDeduction: round2(absenceDeduction),
    unpaidLeaveDeduction: round2(unpaidLeaveDeduction),
    advanceDeduction: round2(advanceDeduction),
    otherDeduction: round2(otherDeduction),
    gross: round2(gross),
    totalDeductions: round2(totalDeductions),
    netSalary: round2(Math.max(0, gross - totalDeductions)),
    presentDays,
    absentDays: personalAbsent,
    leaveDays: leaveDateSet.size,
    lateCount,
    workedHours: round2(workedMinutes / 60),
  };
}
