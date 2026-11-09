import {
  User,
  Condominium,
  Membership,
  Resource,
  Reservation,
  CondoDocument,
  Announcement,
  ServiceRequest,
  Occurrence,
  Assembly,
  Bill,
  Unit,
} from '../types';
import { mockUsers, mockMemberships } from '../mock-data/users';
import { mockCondominiums, mockUnits } from '../mock-data/condominiums';
import { mockResources } from '../mock-data/resources';
import { mockReservations } from '../mock-data/reservations';
import { mockDocuments } from '../mock-data/documents';
import { mockAnnouncements } from '../mock-data/announcements';
import { mockRequests } from '../mock-data/requests';
import { mockOccurrences } from '../mock-data/occurrences';
import { mockAssemblies } from '../mock-data/assemblies';
import { mockBills } from '../mock-data/bills';

/**
 * Authentication Service (Mock)
 */
export const authService = {
  getCurrentUser: (): User => mockUsers[0],
  listUsers: (): Promise<User[]> => Promise.resolve(mockUsers),
  getUserById: (id: string): Promise<User | undefined> =>
    Promise.resolve(mockUsers.find((u) => u.id === id)),
  getMembershipsForUser: (userId: string): Promise<Membership[]> =>
    Promise.resolve(mockMemberships.filter((m) => m.userId === userId)),
};

/**
 * Tenant & Condominium Service (Mock)
 */
export const tenantService = {
  listCondominiums: (): Promise<Condominium[]> => Promise.resolve(mockCondominiums),
  getCondominiumById: (id: string): Promise<Condominium | undefined> =>
    Promise.resolve(mockCondominiums.find((c) => c.id === id)),
  updateCondoSettings: (
    id: string,
    updates: Partial<Condominium>
  ): Promise<Condominium | undefined> => {
    const condo = mockCondominiums.find((c) => c.id === id);
    if (condo) Object.assign(condo, updates);
    return Promise.resolve(condo);
  },
};

/**
 * User & Unit Management Service (Mock)
 */
export const userService = {
  listUnits: (condominiumId: string): Promise<Unit[]> =>
    Promise.resolve(mockUnits.filter((u) => u.condominiumId === condominiumId)),
  getUnitById: (unitId: string): Promise<Unit | undefined> =>
    Promise.resolve(mockUnits.find((u) => u.id === unitId)),
  listMembersForCondo: (condominiumId: string): Promise<Membership[]> =>
    Promise.resolve(mockMemberships.filter((m) => m.condominiumId === condominiumId)),
};

/**
 * Reservations & Resource Service (Mock)
 */
export const reservationService = {
  listResources: (condominiumId: string): Promise<Resource[]> =>
    Promise.resolve(mockResources.filter((r) => r.condominiumId === condominiumId)),
  listReservations: (condominiumId: string): Promise<Reservation[]> =>
    Promise.resolve(mockReservations.filter((r) => r.condominiumId === condominiumId)),
  getReservationById: (id: string): Promise<Reservation | undefined> =>
    Promise.resolve(mockReservations.find((r) => r.id === id)),
};

/**
 * Documents Repository Service (Mock)
 */
export const documentService = {
  listDocuments: (condominiumId: string): Promise<CondoDocument[]> =>
    Promise.resolve(mockDocuments.filter((d) => d.condominiumId === condominiumId)),
};

/**
 * Announcements & Notifications Service (Mock)
 */
export const notificationService = {
  listAnnouncements: (condominiumId: string): Promise<Announcement[]> =>
    Promise.resolve(mockAnnouncements.filter((a) => a.condominiumId === condominiumId)),
};

/**
 * Billing & Financials Service (Mock)
 */
export const billService = {
  listBills: (condominiumId: string): Promise<Bill[]> =>
    Promise.resolve(mockBills.filter((b) => b.condominiumId === condominiumId)),
  getBillById: (id: string): Promise<Bill | undefined> =>
    Promise.resolve(mockBills.find((b) => b.id === id)),
};

/**
 * Service Requests & Tickets Service (Mock)
 */
export const requestService = {
  listRequests: (condominiumId: string): Promise<ServiceRequest[]> =>
    Promise.resolve(mockRequests.filter((r) => r.condominiumId === condominiumId)),
};

/**
 * Occurrences & Incidents Service (Mock)
 */
export const occurrenceService = {
  listOccurrences: (condominiumId: string): Promise<Occurrence[]> =>
    Promise.resolve(mockOccurrences.filter((o) => o.condominiumId === condominiumId)),
};

/**
 * Assemblies & Governance Service (Mock)
 */
export const assemblyService = {
  listAssemblies: (condominiumId: string): Promise<Assembly[]> =>
    Promise.resolve(mockAssemblies.filter((a) => a.condominiumId === condominiumId)),
};
