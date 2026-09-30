import { format, parseISO, differenceInCalendarDays, eachDayOfInterval, getDay, isValid } from 'date-fns';
import type {
  AttendanceRecord,
  CompanySettings,
  Employee,
  LeaveRequest,
  PayrollLine,
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

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

export function leaveDaysInRange(
  fromDate: string,
  toDate: string,
  schedule?: WorkSchedule,
): number {
  const from = parseISO(fromDate);
  const to = parseISO(toDate);
  if (!isValid(from) || !isValid(to) || to < from) return 0;
  const days = eachDayOfInterval({ start: from, end: to });
  if (!schedule) return days.length;
  return days.filter((d) => schedule.workDays.includes(getDay(d))).length;
}

export function calcAttendanceMetrics(
  employee: Employee,
  _date: string,
  checkIn: string | undefined,
  checkOut: string | undefined,
  settings: CompanySettings,
): Pick<
  AttendanceRecord,
  'lateMinutes' | 'earlyLeaveMinutes' | 'overtimeMinutes' | 'workedMinutes' | 'status'
> {
  const sched = employee.schedule;
  if (!checkIn) {
    return {
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeMinutes: 0,
      workedMinutes: 0,
      status: 'غائب',
    };
  }

  const start = parseTimeToMinutes(sched.startTime);
  const end = parseTimeToMinutes(sched.endTime);
  const inM = parseTimeToMinutes(checkIn);
  const lateRaw = Math.max(0, inM - start - settings.lateGraceMinutes);
  const lateMinutes = lateRaw;

  let earlyLeaveMinutes = 0;
  let overtimeMinutes = 0;
  let workedMinutes = 0;
  let status: AttendanceRecord['status'] = lateMinutes > 0 ? 'متأخر' : 'حاضر';

  if (checkOut) {
    const outM = parseTimeToMinutes(checkOut);
    workedMinutes = Math.max(0, outM - inM);
    earlyLeaveMinutes = Math.max(0, end - outM);
    const expected = sched.dailyHours * 60;
    overtimeMinutes = Math.max(0, workedMinutes - expected);
    if (!checkOut) status = 'ناقص';
    else if (earlyLeaveMinutes > 0 && lateMinutes > 0) status = 'متأخر';
    else if (earlyLeaveMinutes > 0) status = 'انصراف مبكر';
    else if (lateMinutes > 0) status = 'متأخر';
    else status = 'حاضر';
  } else {
    status = 'ناقص';
  }

  return { lateMinutes, earlyLeaveMinutes, overtimeMinutes, workedMinutes, status };
}

export function hourlyRate(employee: Employee): number {
  const monthlyHours = employee.schedule.dailyHours * employee.schedule.workDays.length * 4.33;
  return employee.baseSalary / Math.max(monthlyHours, 1);
}

export function dailyRate(employee: Employee, month: string): number {
  const days = monthDays(month).filter((d) => isWorkDay(d, employee.schedule));
  return employee.baseSalary / Math.max(days.length, 1);
}

export function computePayroll(
  employee: Employee,
  month: string,
  attendance: AttendanceRecord[],
  leaves: LeaveRequest[],
  adjustments: SalaryAdjustment[],
  settings: CompanySettings,
): PayrollLine {
  const days = monthDays(month);
  const workDates = days.filter((d) => isWorkDay(d, employee.schedule));
  const empAtt = attendance.filter((a) => a.employeeId === employee.id && a.date.startsWith(month));
  const approvedLeaves = leaves.filter(
    (l) =>
      l.employeeId === employee.id &&
      l.status === 'موافق' &&
      (l.fromDate.startsWith(month) || l.toDate.startsWith(month) || (l.fromDate <= `${month}-31` && l.toDate >= `${month}-01`)),
  );

  const leaveDateSet = new Set<string>();
  const unpaidLeaveDates = new Set<string>();
  for (const leave of approvedLeaves) {
    const range = eachDayOfInterval({
      start: parseISO(leave.fromDate),
      end: parseISO(leave.toDate),
    });
    for (const d of range) {
      const iso = format(d, 'yyyy-MM-dd');
      if (!iso.startsWith(month)) continue;
      if (!isWorkDay(iso, employee.schedule)) continue;
      leaveDateSet.add(iso);
      if (leave.type === 'بدون راتب') unpaidLeaveDates.add(iso);
    }
  }

  let presentDays = 0;
  let lateCount = 0;
  let overtimeMinutes = 0;
  let lateMinutes = 0;
  let workedMinutes = 0;

  for (const a of empAtt) {
    if (a.checkIn) {
      presentDays += 1;
      overtimeMinutes += a.overtimeMinutes;
      lateMinutes += a.lateMinutes;
      workedMinutes += a.workedMinutes;
      if (a.lateMinutes > 0) lateCount += 1;
    }
  }

  const presentOrLeave = new Set([
    ...empAtt.filter((a) => a.checkIn).map((a) => a.date),
    ...leaveDateSet,
  ]);
  const absentDays = workDates.filter((d) => !presentOrLeave.has(d) && d <= todayISO()).length;

  const rateH = hourlyRate(employee);
  const rateD = dailyRate(employee, month);

  const overtimePay = (overtimeMinutes / 60) * rateH * employee.overtimeRate;
  const lateDeduction =
    settings.lateDeductionPerMinute > 0
      ? lateMinutes * settings.lateDeductionPerMinute
      : (lateMinutes / 60) * rateH;

  const absenceDeduction = settings.absenceDeductionDays ? absentDays * rateD : 0;
  const unpaidLeaveDeduction = settings.unpaidLeaveDeduct ? unpaidLeaveDates.size * rateD : 0;

  const monthAdj = adjustments.filter((a) => a.employeeId === employee.id && a.month === month);
  const bonus = monthAdj.filter((a) => a.type === 'مكافأة').reduce((s, a) => s + a.amount, 0);
  const extraAllowance = monthAdj.filter((a) => a.type === 'بدل إضافي').reduce((s, a) => s + a.amount, 0);
  const advanceDeduction = monthAdj.filter((a) => a.type === 'سلفة').reduce((s, a) => s + a.amount, 0);
  const otherDeduction = monthAdj.filter((a) => a.type === 'خصم').reduce((s, a) => s + a.amount, 0);

  const gross =
    employee.baseSalary +
    employee.housingAllowance +
    employee.transportAllowance +
    employee.otherAllowance +
    overtimePay +
    bonus +
    extraAllowance;

  const totalDeductions =
    lateDeduction + absenceDeduction + unpaidLeaveDeduction + advanceDeduction + otherDeduction;

  const netSalary = Math.max(0, gross - totalDeductions);

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    department: employee.department,
    month,
    baseSalary: round2(employee.baseSalary),
    housingAllowance: round2(employee.housingAllowance),
    transportAllowance: round2(employee.transportAllowance),
    otherAllowance: round2(employee.otherAllowance),
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
    netSalary: round2(netSalary),
    presentDays,
    absentDays,
    leaveDays: leaveDateSet.size,
    lateCount,
    workedHours: round2(workedMinutes / 60),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calendarDayCount(from: string, to: string): number {
  return differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
}
