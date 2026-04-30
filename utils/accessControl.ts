/**
 * accessControl.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for content access enforcement.
 *
 * Rules:
 *  - Suspended users → no sermon/resource access at all
 *  - Guest / anonymous → PUBLIC only
 *  - Member → PUBLIC + MEMBER
 *  - Leadership (Pastor, Apostle, Prophet, Teacher, Evangelist,
 *    Leader, Group/Branch/Regional/National/General Head) → all levels
 *  - Media Team / Admin / Super Admin → all levels (they upload content)
 *
 * The Firestore subscription in store.ts already filters at the query level,
 * but we enforce again client-side as a defence-in-depth measure.
 */

import {
  SermonAccessLevel,
  IdentityRole,
  WorkerPermission,
} from '../types.ts';

// ─── Leadership identity roles ────────────────────────────────
const LEADERSHIP_ROLES: IdentityRole[] = [
  IdentityRole.PASTOR,
  IdentityRole.APOSTLE,
  IdentityRole.PROPHET,
  IdentityRole.TEACHER,
  IdentityRole.EVANGELIST,
  IdentityRole.LEADER,
  IdentityRole.GROUP_HEAD,
  IdentityRole.BRANCH_HEAD,
  IdentityRole.REGIONAL_HEAD,
  IdentityRole.NATIONAL_HEAD,
  IdentityRole.GENERAL_HEAD,
];

// ─── Elevated worker permissions ─────────────────────────────
const ELEVATED_PERMISSIONS: WorkerPermission[] = [
  WorkerPermission.SUPER_ADMIN,
  WorkerPermission.ADMIN,
  WorkerPermission.MEDIA_TEAM,
];

// ─── Normalise an access level string → enum ─────────────────
export function normaliseAccessLevel(raw: string | undefined | null): SermonAccessLevel {
  const s = (raw || '').toLowerCase().trim();
  if (s.includes('leadership') || s === 'leadership-only') return SermonAccessLevel.LEADERSHIP;
  if (s.includes('member') || s === 'member-only')         return SermonAccessLevel.MEMBER;
  return SermonAccessLevel.PUBLIC;
}

// ─── Derive user's clearance level ───────────────────────────
export type ClearanceLevel = 'none' | 'public' | 'member' | 'leadership';

export function getUserClearance(currentUser: any): ClearanceLevel {
  if (!currentUser) return 'public'; // guest

  // Suspended → deny everything
  if (currentUser.sermonAccessSuspended) return 'none';

  const perms: WorkerPermission[] = currentUser.workerPermissions || [];
  const role: IdentityRole        = currentUser.identityRole;

  // Elevated workers → leadership-equivalent
  if (perms.some(p => ELEVATED_PERMISSIONS.includes(p))) return 'leadership';

  // Leadership roles
  if (LEADERSHIP_ROLES.includes(role)) return 'leadership';

  // Usher / Prayer team → member level
  if (perms.some(p => [WorkerPermission.USHER, WorkerPermission.PRAYER_TEAM,
                       WorkerPermission.PRAYER_HEAD].includes(p))) return 'member';

  // Regular member
  if (role === IdentityRole.MEMBER) return 'member';

  // Default: public
  return 'public';
}

// ─── Main gate: can user access this resource? ────────────────
export function canAccessResource(resource: any, currentUser: any): boolean {
  const clearance = getUserClearance(currentUser);
  if (clearance === 'none') return false;

  const level = normaliseAccessLevel(resource?.accessLevel || resource?.access_level);

  switch (level) {
    case SermonAccessLevel.PUBLIC:
      return true;
    case SermonAccessLevel.MEMBER:
      return clearance === 'member' || clearance === 'leadership';
    case SermonAccessLevel.LEADERSHIP:
      return clearance === 'leadership';
    default:
      return true; // unknown level → allow (fail open for content)
  }
}

// ─── Filter a list of resources for a user ────────────────────
export function filterResources(resources: any[], currentUser: any): any[] {
  return resources.filter(r => canAccessResource(r, currentUser));
}

// ─── Badge label + colour for access level ───────────────────
export interface AccessBadge {
  label: string;
  bg: string;
  color: string;
  icon: string;
}

export function getAccessBadge(accessLevel: SermonAccessLevel | string): AccessBadge {
  const level = normaliseAccessLevel(accessLevel as string);
  switch (level) {
    case SermonAccessLevel.LEADERSHIP:
      return { label: 'Leadership', bg: '#ede9fe', color: '#6d28d9', icon: '🔐' };
    case SermonAccessLevel.MEMBER:
      return { label: 'Members',    bg: '#dbeafe', color: '#1d4ed8', icon: '👥' };
    default:
      return { label: 'Public',     bg: '#dcfce7', color: '#15803d', icon: '🌍' };
  }
}

// ─── Suspension message ───────────────────────────────────────
export const SUSPENSION_MESSAGE =
  'Your access to sermon content has been suspended. Please contact your branch pastor for assistance.';
