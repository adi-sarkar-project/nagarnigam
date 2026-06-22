import api from "@/api/axios";
import type { AuthResponse, User } from "@/types/app";

export function registerUser(payload: { name: string; email: string; password: string }) {
  return api
    .post<{ message: string; user: User }>("/auth/register", payload)
    .then((response) => response.data);
}

export function loginUser(payload: { email: string; password: string }) {
  return api.post<AuthResponse>("/auth/login", payload).then((response) => response.data);
}

export function getCurrentUser() {
  return api.get<{ user: User }>("/auth/me").then((response) => response.data);
}

export function verifyEmail(token: string) {
  return api.get<{ message: string; user: User }>(`/auth/verify-email/${token}`).then((r) => r.data);
}

export function forgotPassword(email: string) {
  return api
    .post<{ message: string }>("/auth/forgot-password", { email })
    .then((response) => response.data);
}

export function resetPassword(payload: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  return api
    .post<{ message: string }>("/auth/reset-password", payload)
    .then((response) => response.data);
}

export function getPendingUsers() {
  return api
    .get<{ users: User[] }>("/auth/admin/pending-users")
    .then((response) => response.data);
}

export function getActiveCitizens() {
  return api
    .get<{ count: number; users: User[] }>("/auth/admin/active-citizens")
    .then((response) => response.data);
}

export function approveUser(userId: string) {
  return api
    .patch<{ message: string; user: User }>(`/auth/admin/approve-user/${userId}`)
    .then((response) => response.data);
}

export function rejectUser(userId: string, reason: string) {
  return api
    .patch<{ message: string; user: User }>(`/auth/admin/reject-user/${userId}`, { reason })
    .then((response) => response.data);
}

export function registerStaff(payload: { name: string; email: string; password: string }) {
  return api
    .post<{ message: string; user: User }>("/auth/register/staff", payload)
    .then((response) => response.data);
}

export function getPendingStaff() {
  return api
    .get<{ users: User[] }>("/auth/admin/pending-staff")
    .then((response) => response.data);
}

export function getActiveStaff() {
  return api
    .get<{ count: number; users: User[] }>("/auth/admin/active-staff")
    .then((response) => response.data);
}

export function approveStaff(userId: string, designation?: string, assignedCities?: string[]) {
  return api
    .patch<{ message: string; user: User }>(`/auth/admin/approve-staff/${userId}`, { designation, assignedCities })
    .then((response) => response.data);
}

export function rejectStaff(userId: string, reason: string) {
  return api
    .patch<{ message: string; user: User }>(`/auth/admin/reject-staff/${userId}`, { reason })
    .then((response) => response.data);
}
