export type Department =
  | 'الإدارة'
  | 'الموارد البشرية'
  | 'المالية'
  | 'المبيعات'
  | 'التقنية'
  | 'العمليات'
  | 'خدمة العملاء';

export type EmploymentStatus = 'نشط' | 'موقوف' | 'منتهي';

export type LeaveType = 'اعتيادي' | 'مرضي' | 'طارئ' | 'بدون راتب';

export type LeaveStatus = 'معلق' | 'موافق' | 'مرفوض';

export interface WorkSchedule {
  startTime: string; // HH:mm
  endTime: string;
  workDays: number[]; // 0=Sun ... 6=Sat (JS getDay)
  dailyHours: number;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  department: Department;
  jobTitle: string;
  hireDate: string; // yyyy-MM-dd
  status: EmploymentStatus;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowance: number;
  overtimeRate: number; // multiplier of hourly rate, e.g. 1.5
  schedule: WorkSchedule;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // yyyy-MM-dd
  checkIn?: string; // HH:mm
  checkOut?: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  workedMinutes: number;
  status: 'حاضر' | 'متأخر' | 'انصراف مبكر' | 'ناقص' | 'غائب';
  note?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface SalaryAdjustment {
  id: string;
  employeeId: string;
  month: string; // yyyy-MM
  type: 'مكافأة' | 'سلفة' | 'خصم' | 'بدل إضافي';
  amount: number;
  description: string;
}

export interface CompanySettings {
  companyName: string;
  currency: string;
  lateGraceMinutes: number;
  lateDeductionPerMinute: number; // or use hourly
  absenceDeductionDays: boolean; // deduct pro-rata day
  unpaidLeaveDeduct: boolean;
  defaultWorkDays: number[];
  defaultStartTime: string;
  defaultEndTime: string;
  defaultDailyHours: number;
  weekends: number[];
}

export interface PayrollLine {
  employeeId: string;
  employeeName: string;
  department: string;
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

export type AppView =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'leaves'
  | 'payroll'
  | 'reports'
  | 'settings';
