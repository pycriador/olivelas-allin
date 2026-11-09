export type UserRole = 'resident' | 'trustee' | 'admin' | 'global_admin' | 'concierge' | 'fiscal_board';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  isGlobalAdmin?: boolean;
}

export interface Unit {
  id: string;
  condominiumId: string;
  block?: string;
  number: string; // e.g. "101", "502", "1201"
  ownerName: string;
  ownerEmail: string;
  residentCount: number;
  parkingSpaces?: string[];
  status: 'occupied' | 'vacant' | 'rented';
  balanceStatus: 'up_to_date' | 'overdue';
}

export interface Membership {
  id: string;
  userId: string;
  condominiumId: string;
  unitId?: string;
  unitNumber?: string;
  block?: string;
  role: UserRole;
  customTitle?: string; // e.g. "Síndico Geral", "Morador Proprietário", "Gestora Predial"
  permissions: PermissionKey[];
  joinedAt: string;
}

export type PermissionKey =
  | 'view_bills'
  | 'pay_bills'
  | 'view_documents'
  | 'upload_documents'
  | 'manage_documents'
  | 'view_announcements'
  | 'create_announcements'
  | 'publish_announcements'
  | 'book_resources'
  | 'approve_reservations'
  | 'manage_resources'
  | 'view_requests'
  | 'create_requests'
  | 'manage_requests'
  | 'view_occurrences'
  | 'create_occurrences'
  | 'manage_occurrences'
  | 'participate_assemblies'
  | 'vote_assemblies'
  | 'create_assemblies'
  | 'view_financials'
  | 'manage_financials'
  | 'manage_units'
  | 'manage_users'
  | 'manage_condo_settings'
  | 'manage_global_modules'
  | 'manage_tenants';

export interface Condominium {
  id: string;
  name: string;
  code: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  totalUnits: number;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  logoUrl?: string;
  coverImage?: string;
  administratorName?: string;
  trusteeName?: string;
  enabledModules: Record<string, boolean>;
  bookingWindowDays: number; // e.g. 30, 60, 90, 180, 365
}

export type ModuleKey =
  | 'bills'
  | 'documents'
  | 'announcements'
  | 'reservations'
  | 'calendar'
  | 'requests'
  | 'occurrences'
  | 'assemblies'
  | 'ai_search'
  | 'access_control';

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  description: string;
  category: 'core' | 'governance' | 'lifestyle' | 'ai';
  globalEnabled: boolean;
  minPlan: 'starter' | 'professional' | 'enterprise';
  dependencies?: ModuleKey[];
}

export interface Resource {
  id: string;
  condominiumId: string;
  name: string;
  category: 'party_hall' | 'barbecue' | 'sports' | 'leisure' | 'work' | 'wellness' | 'pet';
  description: string;
  capacity: number;
  imageUrl: string;
  status: 'available' | 'maintenance' | 'closed';
  allowBooking: boolean;
  requiresApproval: boolean;
  fee: number; // R$ 0.00 or amount
  cleaningFee?: number;
  minAdvanceHours: number; // e.g. 24h
  maxAdvanceDays: number; // e.g. 60 days
  maxDurationHours: number; // e.g. 6 hours
  allowRecurrence: boolean;
  allowCancellation: boolean;
  cancellationDeadlineHours: number;
  rules: string[];
  operatingHours: {
    start: string; // "08:00"
    end: string;   // "22:00"
  };
}

export interface Reservation {
  id: string;
  condominiumId: string;
  resourceId: string;
  resourceName: string;
  userId: string;
  userName: string;
  userUnit: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "19:00"
  endTime: string; // "22:00"
  status: 'confirmed' | 'pending_approval' | 'rejected' | 'cancelled' | 'completed';
  guestCount: number;
  purpose?: string;
  fee: number;
  createdAt: string;
  notes?: string;
}

export type DocumentCategory =
  | 'convention'
  | 'internal_regulations'
  | 'minutes'
  | 'financial_statements'
  | 'contracts'
  | 'official_notices';

export interface CondoDocument {
  id: string;
  condominiumId: string;
  title: string;
  category: DocumentCategory;
  categoryLabel: string;
  fileName: string;
  fileSize: string;
  fileType: 'pdf' | 'xlsx' | 'docx' | 'image';
  uploadedAt: string;
  uploadedBy: string;
  isGoogleDriveSynced: boolean;
  googleDriveFolder?: string;
  downloadUrl?: string;
  pageCount?: number;
  excerptSnippet?: string;
}

export interface Announcement {
  id: string;
  condominiumId: string;
  title: string;
  category: 'important' | 'maintenance' | 'social' | 'convocation' | 'security';
  categoryLabel: string;
  authorName: string;
  authorRole: string;
  publishedAt: string;
  content: string;
  imageUrl?: string;
  attachments?: { name: string; size: string; url: string }[];
  isPinned?: boolean;
  readByUserIds: string[];
}

export interface ServiceRequest {
  id: string;
  ticketNumber: number; // e.g. 1024
  condominiumId: string;
  userId: string;
  userName: string;
  userUnit: string;
  title: string;
  category: 'document_copy' | 'authorization' | 'tag_access' | 'maintenance' | 'financial' | 'other';
  description: string;
  status: 'open' | 'in_review' | 'in_progress' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  timeline: {
    id: string;
    author: string;
    role: string;
    message: string;
    timestamp: string;
  }[];
}

export interface Occurrence {
  id: string;
  ticketNumber: number; // e.g. 408
  condominiumId: string;
  userId: string;
  userName: string;
  userUnit: string;
  title: string;
  location: string; // e.g. "Corredor Bloco B - 3º Andar", "Garagem G2"
  description: string;
  category: 'noise' | 'leak' | 'lighting' | 'cleanliness' | 'security' | 'pet' | 'other';
  status: 'open' | 'in_review' | 'in_progress' | 'resolved' | 'archived';
  photos: string[];
  createdAt: string;
  updatedAt: string;
  lastResponse?: {
    by: string;
    message: string;
    timestamp: string;
  };
  timeline: {
    id: string;
    author: string;
    role: string;
    message: string;
    timestamp: string;
  }[];
}

export interface AssemblyVotingItem {
  id: string;
  title: string;
  description: string;
  type: 'yes_no_abstain' | 'multiple_choice';
  options?: string[];
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  userVote?: 'yes' | 'no' | 'abstain' | string;
}

export interface Assembly {
  id: string;
  condominiumId: string;
  title: string;
  type: 'ordinary' | 'extraordinary';
  date: string; // YYYY-MM-DD
  time: string; // "19:00"
  location: 'virtual' | 'hybrid' | 'presential';
  meetingUrl?: string;
  status: 'scheduled' | 'live' | 'concluded' | 'cancelled';
  agendaPoints: string[];
  documents: { name: string; size: string; url: string }[];
  quorumRequired: string;
  currentQuorumPercent: number;
  votingItems: AssemblyVotingItem[];
  minutesUrl?: string;
}

export interface Bill {
  id: string;
  condominiumId: string;
  unitId: string;
  unitNumber: string;
  userId: string;
  referenceMonth: string; // "09/2026"
  dueDate: string; // "2026-09-10"
  amount: number; // 842.35
  status: 'open' | 'paid' | 'overdue';
  barcode: string;
  pixKey: string;
  pdfUrl?: string;
  paidAt?: string;
}

export interface AiSearchResult {
  query: string;
  answer: string;
  sourceDocTitle: string;
  pageNumber: number;
  excerpt: string;
  confidence: number;
}
