import api from "@/api/axios";
import type { Complaint } from "@/types/app";

export function getMyComplaints() {
  return api
    .get<{ complaints: Complaint[] }>("/complaints/my")
    .then((response) => response.data);
}

export function getAllComplaints() {
  return api.get<{ complaints: Complaint[] }>("/complaints").then((response) => response.data);
}

export function createComplaint(formData: FormData) {
  return api
    .post<{ message: string; complaint: Complaint }>("/complaints/create", formData)
    .then((response) => response.data);
}

export function uploadAfterImage(complaintId: string, formData: FormData) {
  return api
    .patch<{ message: string; complaint: Complaint }>(
      `/complaints/${complaintId}/after-image`,
      formData,
    )
    .then((response) => response.data);
}

export function resolveComplaint(complaintId: string) {
  return api
    .patch<{ message: string; complaint: Complaint }>(`/complaints/${complaintId}/resolve`)
    .then((response) => response.data);
}

export function assignComplaintToStaff(complaintId: string, staffId: string) {
  return api
    .patch<{ message: string; complaint: Complaint }>(`/complaints/assign/${complaintId}/${staffId}`)
    .then((response) => response.data);
}

export function getAssignedComplaints() {
  return api
    .get<{ complaints: Complaint[] }>("/complaints/assigned")
    .then((response) => response.data);
}

export function submitPendingResolution(complaintId: string, formData: FormData) {
  return api
    .patch<{ message: string; complaint: Complaint }>(`/complaints/submit-pending-resolution/${complaintId}`, formData)
    .then((response) => response.data);
}

export function approvePendingResolution(complaintId: string) {
  return api
    .patch<{ message: string; complaint: Complaint }>(`/complaints/approve-pending-resolution/${complaintId}`)
    .then((response) => response.data);
}

export function rejectPendingResolution(complaintId: string) {
  return api
    .patch<{ message: string; complaint: Complaint }>(`/complaints/reject-pending-resolution/${complaintId}`)
    .then((response) => response.data);
}
