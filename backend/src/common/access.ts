import { Role } from '@prisma/client';

/**
 * Single source of truth for who sees what.
 * Change it here, it changes everywhere.
 */

/** Roles that see EVERY lead. Others see only leads assigned to them. */
export const FULL_LEAD_ACCESS: Role[] = [
  Role.SUPER_ADMIN,
  Role.OWNER,
  Role.SALES_MANAGER,
  Role.MARKETING,
  Role.OPERATIONS,
  Role.ACCOUNTS,
];

/** Roles allowed into the leads module at all. */
export const LEAD_MODULE_ROLES: Role[] = [
  ...FULL_LEAD_ACCESS,
  Role.SALES_EXEC,
  Role.AGENT,
];

/**
 * Roles that may see vendor CONTACT + BANK details.
 * This is the supplier-protection boundary: everyone can see rates (they need
 * them to quote), but only these roles get the hotelier's direct number.
 */
export const VENDOR_CONTACT_ACCESS: Role[] = [
  Role.SUPER_ADMIN,
  Role.OWNER,
  Role.OPERATIONS,
  Role.ACCOUNTS,
];

/** Roles that may create/edit vendors and rates. */
export const VENDOR_WRITE_ACCESS: Role[] = [
  Role.SUPER_ADMIN,
  Role.OWNER,
  Role.OPERATIONS,
];

export interface Actor {
  id: string;
  role: Role;
}

export const canSeeAllLeads = (role: Role): boolean =>
  FULL_LEAD_ACCESS.includes(role);

export const canSeeVendorContacts = (role: Role): boolean =>
  VENDOR_CONTACT_ACCESS.includes(role);
