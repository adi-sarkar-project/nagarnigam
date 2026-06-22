export type Role = "admin" | "citizen" | "staff";
export type ComplaintCategory = string;
export type ComplaintStatus = "pending" | "assigned" | "resolution_pending" | "resolved";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified?: boolean;
  isApproved?: boolean;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  designation?: string;
  assignedCities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: ComplaintCategory;
  location: {
    district: string;
    city: string;
  };
  address: string;
  description: string;
  beforeImageUrl: string;
  afterImageUrl?: string;
  pendingAfterImageUrl?: string;
  pendingSubmittedBy?: string | null;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  assignedStaff?: User | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
