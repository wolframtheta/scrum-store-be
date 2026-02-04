export class BasketScheduleCalendarResponseDto {
  config: {
    preferredWeekday: number | null;
    preferredTime: string | null;
  };
  /** All votes in the month (manager sees all, preparer sees only their own + all for display if we want; we'll return all votes for calendar display, preparer can only update own) */
  votes: Array<{ date: string; userEmail: string; userName?: string; status: 'yes' | 'no' | 'if_needed' }>;
  assignments: Array<{ date: string; assignedUserEmail: string; assignedUserName?: string }>;
}
