import type {
  AttendanceRecord,
  CompanySettings,
  Employee,
  LeaveRequest,
  SalaryAdjustment,
} from '../types';
import { calcAttendanceMetrics, todayISO, uid } from './payroll';

const KEY = 'attendance_payroll_v1';

export interface AppState {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  adjustments: SalaryAdjustment[];
  settings: CompanySettings;
}

export const defaultSettings: CompanySettings = {
  companyName: 'مؤسسة النخبة للموارد البشرية',
  currency: 'ر.س',
  lateGraceMinutes: 10,
  lateDeductionPerMinute: 0,
  absenceDeductionDays: true,
  unpaidLeaveDeduct: true,
  defaultWorkDays: [0, 1, 2, 3, 4], // Sun-Thu
  defaultStartTime: '09:00',
  defaultEndTime: '17:00',
  defaultDailyHours: 8,
  weekends: [5, 6],
};

function defaultSchedule() {
  return {
    startTime: defaultSettings.defaultStartTime,
    endTime: defaultSettings.defaultEndTime,
    workDays: [...defaultSettings.defaultWorkDays],
    dailyHours: defaultSettings.defaultDailyHours,
  };
}

export function createSeedState(): AppState {
  const employees: Employee[] = [
    {
      id: 'emp_001',
      code: 'E-1001',
      name: 'أحمد محمد العتيبي',
      nationalId: '1098765432',
      phone: '0501234567',
      email: 'ahmed@example.com',
      department: 'الإدارة',
      jobTitle: 'مدير عام',
      hireDate: '2022-01-15',
      status: 'نشط',
      baseSalary: 18000,
      housingAllowance: 3000,
      transportAllowance: 1000,
      otherAllowance: 500,
      overtimeRate: 1.5,
      schedule: defaultSchedule(),
    },
    {
      id: 'emp_002',
      code: 'E-1002',
      name: 'سارة خالد الشمري',
      nationalId: '1087654321',
      phone: '0559876543',
      email: 'sara@example.com',
      department: 'الموارد البشرية',
      jobTitle: 'أخصائية موارد بشرية',
      hireDate: '2023-03-01',
      status: 'نشط',
      baseSalary: 9500,
      housingAllowance: 1500,
      transportAllowance: 800,
      otherAllowance: 200,
      overtimeRate: 1.5,
      schedule: defaultSchedule(),
    },
    {
      id: 'emp_003',
      code: 'E-1003',
      name: 'فهد عبدالله القحطاني',
      nationalId: '1076543210',
      phone: '0533332211',
      email: 'fahd@example.com',
      department: 'التقنية',
      jobTitle: 'مطور برمجيات',
      hireDate: '2024-06-10',
      status: 'نشط',
      baseSalary: 12000,
      housingAllowance: 2000,
      transportAllowance: 900,
      otherAllowance: 300,
      overtimeRate: 1.75,
      schedule: defaultSchedule(),
    },
    {
      id: 'emp_004',
      code: 'E-1004',
      name: 'نورة سعد الدوسري',
      nationalId: '1065432109',
      phone: '0544445566',
      email: 'noura@example.com',
      department: 'المالية',
      jobTitle: 'محاسبة',
      hireDate: '2023-09-20',
      status: 'نشط',
      baseSalary: 8500,
      housingAllowance: 1200,
      transportAllowance: 700,
      otherAllowance: 150,
      overtimeRate: 1.5,
      schedule: defaultSchedule(),
    },
    {
      id: 'emp_005',
      code: 'E-1005',
      name: 'يوسف إبراهيم الحربي',
      nationalId: '1054321098',
      phone: '0567788990',
      email: 'yousef@example.com',
      department: 'المبيعات',
      jobTitle: 'مندوب مبيعات',
      hireDate: '2025-01-05',
      status: 'نشط',
      baseSalary: 7000,
      housingAllowance: 1000,
      transportAllowance: 1200,
      otherAllowance: 400,
      overtimeRate: 1.5,
      schedule: defaultSchedule(),
    },
  ];

  const today = todayISO();
  const settings = { ...defaultSettings };
  const attendance: AttendanceRecord[] = employees.slice(0, 4).map((emp, i) => {
    const checkIn = i === 1 ? '09:25' : '08:55';
    const checkOut = i === 2 ? undefined : i === 0 ? '18:10' : '17:05';
    const metrics = calcAttendanceMetrics(emp, today, checkIn, checkOut, settings);
    return {
      id: uid('att'),
      employeeId: emp.id,
      date: today,
      checkIn,
      checkOut,
      ...metrics,
    };
  });

  const leaves: LeaveRequest[] = [
    {
      id: uid('leave'),
      employeeId: 'emp_005',
      type: 'اعتيادي',
      fromDate: today,
      toDate: today,
      days: 1,
      reason: 'ظرف عائلي',
      status: 'موافق',
      createdAt: today,
    },
  ];

  const month = today.slice(0, 7);
  const adjustments: SalaryAdjustment[] = [
    {
      id: uid('adj'),
      employeeId: 'emp_001',
      month,
      type: 'مكافأة',
      amount: 1500,
      description: 'مكافأة أداء ربع سنوي',
    },
    {
      id: uid('adj'),
      employeeId: 'emp_003',
      month,
      type: 'سلفة',
      amount: 1000,
      description: 'سلفة شهرية',
    },
  ];

  return { employees, attendance, leaves, adjustments, settings };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const seed = createSeedState();
      saveState(seed);
      return seed;
    }
    return JSON.parse(raw) as AppState;
  } catch {
    return createSeedState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState(): AppState {
  const seed = createSeedState();
  saveState(seed);
  return seed;
}
