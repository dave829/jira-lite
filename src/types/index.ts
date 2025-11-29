// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  profile_image: string | null;
  created_at: string;
  deleted_at: string | null;
}

// Team Types
export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  deleted_at: string | null;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  user?: User;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  invited_by: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

// Project Types
export interface Project {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_archived: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface ProjectFavorite {
  id: string;
  project_id: string;
  user_id: string;
}

export interface ProjectStatus {
  id: string;
  project_id: string;
  name: string;
  color: string;
  position: number;
  is_default: boolean;
    wip_limit?: number | null;  // 추가
}

export interface ProjectLabel {
  id: string;
  project_id: string;
  name: string;
  color: string;
}

// Issue Types
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Issue {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status_id: string;
  priority: Priority;
  assignee_id: string | null;
  owner_id: string;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Relations
  status?: ProjectStatus;
  assignee?: User;
  owner?: User;
  labels?: ProjectLabel[];
  subtasks?: Subtask[];
}

export interface IssueLabel {
  id: string;
  issue_id: string;
  label_id: string;
}

export interface Subtask {
  id: string;
  issue_id: string;
  title: string;
  is_completed: boolean;
  position: number;
}

export interface IssueHistory {
  id: string;
  issue_id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
  user?: User;
}

// Comment Types
export interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user?: User | null;
}

// AI Types
export type AICacheType = 'summary' | 'suggestion' | 'comment_summary';

export interface AICache {
  id: string;
  issue_id: string;
  type: AICacheType;
  content: string;
  created_at: string;
  invalidated_at: string | null;
}

export interface AIRateLimit {
  id: string;
  user_id: string;
  count: number;
  window_start: string;
}

// Notification Types
export type NotificationType = 
  | 'issue_assigned'
  | 'comment_added'
  | 'due_date_approaching'
  | 'due_date_today'
  | 'team_invitation'
  | 'role_changed';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// Activity Log Types
export type ActivityAction = 
  | 'member_joined'
  | 'member_left'
  | 'member_kicked'
  | 'role_changed'
  | 'project_created'
  | 'project_deleted'
  | 'project_archived'
  | 'team_updated';

export interface ActivityLog {
  id: string;
  team_id: string;
  actor_id: string;
  action: ActivityAction;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
  actor?: User;
}

// WIP Limit
export interface WIPLimit {
  id: string;
  project_id: string;
  status_id: string;
  limit: number | null;
}
