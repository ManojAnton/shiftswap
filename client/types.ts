export type Role = 'Manager' | 'Employee';
export type Status = 'Active' | 'Inactive';
export type Skill = 'Cashier' | 'Floor Staff' | 'Stock Room' | 'Supervisor' | 'Customer Service';
export type EmploymentType = 'Full-Time' | 'Part-Time';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export type ScheduleStatus = 'Draft' | 'Published';
export type SwapOverallStatus = 'AwaitingEmployee' | 'AwaitingManager' | 'Approved' | 'RejectedByEmployee' | 'RejectedByManager' | 'Cancelled';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: Role;
  employeeId?: string;
  phone?: string;
  skill?: Skill;
  employmentType?: EmploymentType;
  status: Status;
  createdAt: string;
}

export interface Schedule {
  _id: string;
  weekStartDate: string;
  weekEndDate: string;
  status: ScheduleStatus;
  createdBy: User | string;
  publishedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Shift {
  _id: string;
  scheduleId: Schedule | string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  requiredSkill: Skill;
  assignedEmployeeId?: User | null;
  location?: string;
  notes?: string;
  swappedWith?: User | null;
  swappedAt?: string | null;
  swapRequestId?: string | null;
}

export interface Availability {
  _id: string;
  employeeId: User | string;
  dayOfWeek: DayOfWeek;
  isAvailable: boolean;
  availableFrom: string;
  availableTo: string;
}

export interface ShiftWithEmployee extends Shift {
  theirShift?: Shift;
}

export interface AvailableForShiftResponse {
  canExchange: (User & { theirShift: Shift })[];
  canCover: User[];
}
  _id: string;
  shiftId: Shift;
  requestedByEmployeeId: User;
  targetEmployeeId: User;
  reason?: string;
  employeeStatus: 'Pending' | 'Accepted' | 'Rejected';
  employeeDecidedAt?: string;
  employeeRejectionReason?: string;
  managerStatus: 'Pending' | 'Approved' | 'Rejected';
  decidedByManagerId?: User;
  managerDecidedAt?: string;
  managerRejectionReason?: string;
  overallStatus: SwapOverallStatus;
  targetEmployeeShift?: Shift | null;
  createdAt: string;
}

export interface ManagerDashboard {
  totalEmployees: number;
  activeEmployees: number;
  totalShiftsThisWeek: number;
  pendingSwaps: number;
  awaitingManagerSwaps: number;
  approvedSwaps: number;
  rejectedSwaps: number;
  publishedSchedules: number;
  recentActivity: Array<{ action: string; performedBy: User; timestamp: string; details?: Record<string, unknown> }>;
}

export interface EmployeeDashboard {
  totalHoursThisWeek: number;
  shiftsThisWeek: number;
  pendingSwaps: number;
  incomingSwaps: number;
  approvedSwaps: number;
  daysOff: number;
}
