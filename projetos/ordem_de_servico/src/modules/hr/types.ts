export interface HREmployee {
  id: string;
  name: string;
  document: string; // CPF
  email: string;
  phone: string;
  role: string;
  departmentId?: string;
  departmentName?: string;
  admissionDate: string;
  salary: number;
  commissionRate: number; // percentage
  status: "active" | "inactive" | "vacation" | "leave";
  createdAt: string;
  updatedAt: string;
}

export interface HRTimeSheet {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string; // "08:00"
  clockOut: string; // "17:00"
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface HRPayroll {
  id: string;
  employeeId: string;
  employeeName: string;
  monthYear: string; // "07/2026"
  baseSalary: number;
  commissions: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  paymentStatus: "pending" | "paid";
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HRCommission {
  id: string;
  employeeId: string;
  employeeName: string;
  serviceOrderId: string;
  serviceOrderNumber?: string;
  value: number;
  percentage: number;
  date: string;
  status: "pending" | "paid";
  paidAt?: string;
  createdAt: string;
}

export interface HRShiftSchedule {
  id: string;
  employeeId: string;
  employeeName: string;
  dayOfWeek: number; // 1 (Mon) - 7 (Sun)
  startTime: string; // "08:00"
  endTime: string; // "17:00"
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HRDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  vacationEmployees: number;
  pendingTimeSheets: number;
  monthlyPayrollTotal: number;
  pendingCommissions: number;
  paidCommissionsMonth: number;
}
