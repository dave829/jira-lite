// Data Limits (PRD 기준)
export const LIMITS = {
  MAX_PROJECTS_PER_TEAM: 15,
  MAX_ISSUES_PER_PROJECT: 200,
  MAX_SUBTASKS_PER_ISSUE: 20,
  MAX_LABELS_PER_PROJECT: 20,
  MAX_LABELS_PER_ISSUE: 5,
  MAX_CUSTOM_STATUSES: 5,
  MAX_WIP_LIMIT: 50,
  
  // Text Limits
  TEAM_NAME_MAX: 50,
  PROJECT_NAME_MAX: 100,
  PROJECT_DESCRIPTION_MAX: 2000,
  ISSUE_TITLE_MAX: 200,
  ISSUE_DESCRIPTION_MAX: 5000,
  SUBTASK_TITLE_MAX: 200,
  LABEL_NAME_MAX: 30,
  STATUS_NAME_MAX: 30,
  COMMENT_MAX: 1000,
  USER_NAME_MAX: 50,
  EMAIL_MAX: 255,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 100,
  
  // Time Limits
  TOKEN_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  TEAM_INVITATION_EXPIRY_DAYS: 7,
  
  // AI Limits
  AI_MIN_DESCRIPTION_LENGTH: 10,
  AI_MIN_COMMENTS_FOR_SUMMARY: 5,
  AI_RATE_LIMIT_PER_MINUTE: 10,
  AI_RATE_LIMIT_PER_DAY: 100,
} as const;

// Default Statuses
export const DEFAULT_STATUSES = [
  { name: 'Backlog', color: '#6B7280', position: 0, is_default: true },
  { name: 'In Progress', color: '#3B82F6', position: 1, is_default: true },
  { name: 'Done', color: '#10B981', position: 2, is_default: true },
] as const;

// Priority Colors
export const PRIORITY_COLORS = {
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#6B7280',
} as const;

export const PRIORITY_LABELS = {
  HIGH: '긴급',
  MEDIUM: '보통',
  LOW: '낮음',
} as const;
