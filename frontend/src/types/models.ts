export enum GoalStatus {
  Draft = "Draft",
  Submitted = "Submitted",
  Approved = "Approved",
  Rejected = "Rejected",
  Completed = "Completed",
  Archived = "Archived",
}

export enum UnitOfMeasurement {
  Numeric = "Numeric",
  Percentage = "Percentage",
  Timeline = "Timeline",
  ZeroBased = "ZeroBased",
}

export enum CheckInStatus {
  NotStarted = "Not Started",
  OnTrack = "On Track",
  Completed = "Completed",
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  roles: Role[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface ThrustArea {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
  thrust_area_id: string;
  thrust_area?: ThrustArea;
  title: string;
  description?: string;
  unit_of_measurement: UnitOfMeasurement;
  target: number;
  weightage: number;
  status: GoalStatus;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  comments?: GoalComment[];
}

export interface GoalComment {
  id: string;
  goal_id: string;
  user_id?: string;
  comment: string;
  created_at: string;
}

export interface CheckIn {
  id: string;
  goal_id: string;
  user_id: string;
  quarterly_cycle_id: string;
  actual_value?: number;
  status: CheckInStatus;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface QuarterlyCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  goal_setting_start: string;
  goal_setting_end: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface SharedGoal {
  id: string;
  goal_id: string;
  user_id: string;
  weightage: number;
}
