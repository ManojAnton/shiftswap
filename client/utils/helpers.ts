export const DAYS: string[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const SKILLS = ['Cashier','Floor Staff','Stock Room','Supervisor','Customer Service'];

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(dateStr).toLocaleDateString('en-CA', {
    timeZone: 'UTC',
    year: 'numeric', month: 'short', day: 'numeric',
    ...opts,
  });
}

export function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,'0')} ${ampm}`;
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

export function getWeekEnd(weekStart: Date) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23,59,59,999);
  return d;
}

export function shiftHours(startTime: string, endTime: string) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

export function getDayOfWeek(dateStr: string): string {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date(dateStr).getUTCDay()];
}

export function toInputDate(date: Date) {
  return date.toISOString().split('T')[0];
}

export type BadgeVariant = 'success'|'warning'|'danger'|'purple'|'accent'|'muted';

export function statusColor(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    AwaitingEmployee: 'warning',
    AwaitingManager: 'purple',
    Approved: 'success',
    RejectedByEmployee: 'danger',
    RejectedByManager: 'danger',
    Cancelled: 'muted',
    Draft: 'warning',
    Published: 'success',
    Active: 'success',
    Inactive: 'danger',
    Pending: 'warning',
    Accepted: 'success',
    Rejected: 'danger',
  };
  return map[status] || 'muted';
}

export function statusLabel(status: string) {
  const map: Record<string, string> = {
    AwaitingEmployee: 'Awaiting Employee',
    AwaitingManager: 'Awaiting Manager',
    Approved: 'Approved',
    RejectedByEmployee: 'Rejected by Employee',
    RejectedByManager: 'Rejected by Manager',
    Cancelled: 'Cancelled',
  };
  return map[status] || status;
}

export function actionLabel(action: string) {
  const map: Record<string, string> = {
    ScheduleCreated: 'Schedule created',
    SchedulePublished: 'Schedule published',
    SwapRequested: 'Swap requested',
    SwapAcceptedByEmployee: 'Swap accepted by employee',
    SwapRejectedByEmployee: 'Swap rejected by employee',
    SwapApprovedByManager: 'Swap approved by manager',
    SwapRejectedByManager: 'Swap rejected by manager',
  };
  return map[action] || action;
}

export function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
}

export function skillColor(skill: string) {
  const map: Record<string, string> = {
    'Cashier': '#3b82f6',
    'Floor Staff': '#10b981',
    'Stock Room': '#f59e0b',
    'Supervisor': '#8b5cf6',
    'Customer Service': '#ec4899',
  };
  return map[skill] || '#64748b';
}
