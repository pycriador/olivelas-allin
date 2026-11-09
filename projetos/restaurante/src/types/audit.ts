export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETED'
  | 'SESSION_CREATED'
  | 'SESSION_REFRESHED'
  | 'SESSION_REVOKED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'USER_REACTIVATED'
  | 'USER_DELETED'
  | 'RESTAURANT_CREATED'
  | 'RESTAURANT_UPDATED'
  | 'RESTAURANT_SUSPENDED'
  | 'RESTAURANT_REACTIVATED'
  | 'RESTAURANT_DELETED'
  | 'MEMBER_ADDED'
  | 'MEMBER_UPDATED'
  | 'MEMBER_SUSPENDED'
  | 'MEMBER_REMOVED'
  | 'ROLE_CHANGED'
  | 'SUPPORT_ACCESS_STARTED'
  | 'SUPPORT_ACCESS_ENDED'
  | 'PERMISSION_DENIED'
  | 'RLS_DENIED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_UPDATED'
  | 'CATEGORY_DELETED'
  | 'CATEGORY_STATUS_CHANGED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'PRODUCT_STATUS_CHANGED'
  | 'PRODUCT_AVAILABILITY_CHANGED'
  | 'PRODUCT_PRICE_CHANGED'
  | 'ADD_ON_CREATED'
  | 'ADD_ON_UPDATED'
  | 'ADD_ON_DELETED'
  | 'ADD_ON_GROUP_CREATED'
  | 'ADD_ON_GROUP_UPDATED'
  | 'ADD_ON_GROUP_DELETED'
  | 'PRODUCT_ADD_ON_GROUP_ATTACHED'
  | 'PRODUCT_ADD_ON_GROUP_DETACHED'
  | 'MENU_IMAGE_UPLOADED'
  | 'MENU_IMAGE_DELETED';

export interface AuditLog {
  id: string;
  restaurant_id?: string | null;
  actor_user_id?: string | null;
  actor_platform_role?: string | null;
  action: AuditAction | string;
  entity_type: string;
  entity_id?: string | null;
  session_id?: string | null;
  support_session_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  // Hydrated details
  actor_name?: string | null;
  actor_email?: string | null;
  restaurant_name?: string | null;
}

export interface AuditFilterParams {
  action?: string;
  actorId?: string;
  restaurantId?: string;
  entityType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}
