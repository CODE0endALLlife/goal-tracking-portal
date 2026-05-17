export interface ApiError {
  detail: string | { msg: string; type: string }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

export interface GoalCreatePayload {
  thrust_area_id: string;
  title: string;
  description?: string;
  unit_of_measurement: string;
  target: number;
  weightage: number;
}

export interface GoalUpdatePayload {
  thrust_area_id?: string;
  title?: string;
  description?: string;
  unit_of_measurement?: string;
  target?: number;
  weightage?: number;
}

export interface GoalApprovalPayload {
  target?: number;
  weightage?: number;
  comment?: string;
}

export interface GoalRejectPayload {
  comment: string;
}

export interface CheckInPayload {
  goal_id: string;
  quarterly_cycle_id: string;
  actual_value?: number;
  status: string;
  comments?: string;
}

export interface TeamAnalytics {
  total_goals: number;
  status_distribution: Record<string, number>;
  team_size: number;
}
