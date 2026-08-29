export type Screen =
  | 'home'
  | 'cause-detail'
  | 'contribute'
  | 'success'
  | 'ledger'
  | 'impact'
  | 'profile'
  | 'admin';

export type NavTab = 'home' | 'causes' | 'ledger' | 'impact' | 'profile';

export type UserRole = 'donante' | 'admin' | 'adminmaster';

export type CauseStatus = 'activa' | 'completada' | 'pausada';

export type CauseCategory = 'Salud' | 'Despensas' | 'Especie';

export type FilterCategory = 'Todas' | 'Salud' | 'Despensas' | 'Especie' | 'Completadas';

export type ContributionType = 'economica' | 'especie';

export type ContributionStatus = 'pendiente' | 'validado' | 'rechazado' | 'correccion';

export interface InKindGoal {
  item: string;
  target: number;
  current: number;
}

export interface BankInfo {
  bank: string;
  beneficiary: string;
  clabe: string;
  concept: string;
}

export interface Cause {
  id: string;
  title: string;
  story: string;
  category: CauseCategory;
  status: CauseStatus;
  goalAmount: number;
  currentAmount: number;
  inKindGoals: InKindGoal[];
  deadline: string;
  coverImage: string;
  gallery: string[];
  organizer: string;
  beneficiary: string;
  bankInfo: BankInfo;
}

export interface LedgerEntry {
  id: string;
  donorName: string;
  anonymous: boolean;
  date: string;
  causeTitle: string;
  causeId: string;
  type: ContributionType;
  amount?: number;
  item?: string;
  quantity?: number;
  status: ContributionStatus;
  validatedAt: string;
}

export interface PendingItem {
  id: string;
  donorName: string;
  email: string;
  phone?: string;
  anonymous: boolean;
  causeTitle: string;
  causeId: string;
  type: ContributionType;
  amount?: number;
  item?: string;
  quantity?: number;
  submittedAt: string;
  status: ContributionStatus;
  voucherThumb: string;
  internalNote?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface SubmissionData {
  causeTitle: string;
  type: ContributionType;
  amount?: number;
  item?: string;
  quantity?: number;
  donorName: string;
  anonymous: boolean;
  submissionId: string;
  submittedAt: string;
}
