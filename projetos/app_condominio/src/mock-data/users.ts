import { User, Membership, PermissionKey } from '../types';

const defaultResidentPermissions: PermissionKey[] = [
  'view_bills',
  'pay_bills',
  'view_documents',
  'view_announcements',
  'book_resources',
  'view_requests',
  'create_requests',
  'view_occurrences',
  'create_occurrences',
  'participate_assemblies',
  'vote_assemblies',
];

const defaultTrusteePermissions: PermissionKey[] = [
  ...defaultResidentPermissions,
  'upload_documents',
  'manage_documents',
  'create_announcements',
  'publish_announcements',
  'approve_reservations',
  'manage_resources',
  'manage_requests',
  'manage_occurrences',
  'create_assemblies',
  'view_financials',
  'manage_units',
  'manage_users',
  'manage_condo_settings',
];

const defaultAdminPermissions: PermissionKey[] = [
  ...defaultTrusteePermissions,
  'manage_financials',
];

const globalAdminPermissions: PermissionKey[] = [
  ...defaultAdminPermissions,
  'manage_global_modules',
  'manage_tenants',
];

export const mockUsers: User[] = [
  {
    id: 'user-willian',
    name: 'Willian Jesus',
    email: 'willian.o.jesus@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '(21) 98845-1234',
    isGlobalAdmin: true,
  },
];

export const mockMemberships: Membership[] = [
  // Willian's memberships across multiple condominiums (Multi-Tenant proof)
  {
    id: 'mem-will-solar-resident',
    userId: 'user-willian',
    condominiumId: 'condo-solar-park',
    unitId: 'u-sp-101',
    unitNumber: '101',
    block: 'Bloco A',
    role: 'resident',
    customTitle: 'Morador Proprietário',
    permissions: defaultResidentPermissions,
    joinedAt: '2024-02-15',
  },
  {
    id: 'mem-will-solar-trustee',
    userId: 'user-willian',
    condominiumId: 'condo-solar-park',
    unitId: 'u-sp-101',
    unitNumber: '101',
    block: 'Bloco A',
    role: 'trustee',
    customTitle: 'Síndico Geral Eleito',
    permissions: defaultTrusteePermissions,
    joinedAt: '2024-03-01',
  },
  {
    id: 'mem-will-green-village',
    userId: 'user-willian',
    condominiumId: 'condo-green-village',
    unitId: 'u-gv-502',
    unitNumber: '502',
    block: 'Torre Única',
    role: 'resident',
    customTitle: 'Morador Investidor',
    permissions: defaultResidentPermissions,
    joinedAt: '2025-01-10',
  },
  {
    id: 'mem-will-jardim-palmeiras',
    userId: 'user-willian',
    condominiumId: 'condo-residencial-jardim',
    unitId: 'u-jp-1201',
    unitNumber: '1201',
    block: 'Edifício Jatobá',
    role: 'trustee',
    customTitle: 'Síndico Executivo',
    permissions: defaultTrusteePermissions,
    joinedAt: '2023-11-20',
  },
  {
    id: 'mem-will-admin-global',
    userId: 'user-willian',
    condominiumId: 'condo-solar-park',
    role: 'global_admin',
    customTitle: 'Global Admin Olivelas All In',
    permissions: globalAdminPermissions,
    joinedAt: '2023-01-01',
  },
];
