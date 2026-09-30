export type LeaveType = 'اعتيادي' | 'مرضي' | 'طارئ' | 'بدون راتب';

export interface WorkSchedule {
  startTime: string;
  endTime: string;
  workDays: number[]; // 0=Sun ... 6=Sat
  dailyHours: number;
}

export interface Profile {
  name: string;
  jobTitle: string;
  workplace: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  overtimeRate: number;
  schedule: WorkSchedule;
  currency: string;
  lateGraceMinutes: number;
  lateDeductionPerMinute: number;
  absenceDeductionDays: boolean;
  unpaidLeaveDeduct: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  workedMinutes: number;
  status: 'حاضر' | 'متأخر' | 'انصراف مبكر' | 'ناقص' | 'غائب';
  note?: string;
}

export interface LeaveDay {
  id: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
}

export interface SalaryAdjustment {
  id: string;
  month: string;
  type: 'مكافأة' | 'سلفة' | 'خصم' | 'بدل إضافي';
  amount: number;
  description: string;
}

export interface MonthSalary {
  month: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  overtimePay: number;
  overtimeMinutes: number;
  bonus: number;
  extraAllowance: number;
  lateDeduction: number;
  absenceDeduction: number;
  unpaidLeaveDeduction: number;
  advanceDeduction: number;
  otherDeduction: number;
  gross: number;
  totalDeductions: number;
  netSalary: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateCount: number;
  workedHours: number;
}

export type AppView = 'home' | 'attendance' | 'leaves' | 'salary' | 'settings';
