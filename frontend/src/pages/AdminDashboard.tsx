import { useRef, useState, ChangeEvent, useEffect, useCallback } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ImagePlus,
  Inbox,
  Mail,
  ShieldCheck,
  MapPin,
  UserCheck,
  UserX,
  Users,
  UserCog,
  Hourglass,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { StatusBadge } from "@/components/StatusBadge";
import { SafeImage } from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getAllComplaints,
  resolveComplaint,
  uploadAfterImage,
  assignComplaintToStaff,
  approvePendingResolution,
  rejectPendingResolution,
} from "@/api/complaints";
import {
  approveUser,
  getActiveCitizens,
  getPendingUsers,
  rejectUser,
  getPendingStaff,
  getActiveStaff,
  approveStaff,
  rejectStaff,
} from "@/api/auth";
import { getErrorMessage } from "@/lib/api-error";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Complaint, ComplaintStatus, User } from "@/types/app";

export default function AdminDashboard() {
  const { user: adminUser } = useAuth();
  const [section, setSection] = useState<"complaints" | "users" | "active" | "staff-pending" | "staff-active">(
    "complaints",
  );
  const [list, setList] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<"all" | ComplaintStatus>("all");
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [activeCitizens, setActiveCitizens] = useState<User[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeLoading, setActiveLoading] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>(
    {},
  );
  const [pendingStaff, setPendingStaff] = useState<User[]>([]);
  const [activeStaff, setActiveStaff] = useState<User[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [staffPendingLoading, setStaffPendingLoading] = useState(false);
  const [staffActiveLoading, setStaffActiveLoading] = useState(false);
  const [staffDesignations, setStaffDesignations] = useState<Record<string, string>>({});
  const [staffAssignedCities, setStaffAssignedCities] = useState<Record<string, string>>({});
  const [pendingResolutionBusy, setPendingResolutionBusy] = useState<string | null>(null);


  // Fetch Functions - Declared first to avoid "before initialization" error
  const fetchComplaints = useCallback(async () => {
    try {
      const data = await getAllComplaints();
      setList(data.complaints);
    } catch {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await getPendingUsers();
      setPendingUsers(data.users);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load pending users"));
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const fetchActiveCitizens = useCallback(async () => {
    setActiveLoading(true);
    try {
      const data = await getActiveCitizens();
      setActiveCitizens(data.users);
      setActiveCount(data.count);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load active citizens"));
    } finally {
      setActiveLoading(false);
    }
  }, []);

  const fetchPendingStaff = useCallback(async () => {
    setStaffPendingLoading(true);
    try {
      const data = await getPendingStaff();
      setPendingStaff(data.users);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load pending staff"));
    } finally {
      setStaffPendingLoading(false);
    }
  }, []);

  const fetchActiveStaff = useCallback(async () => {
    setStaffActiveLoading(true);
    try {
      const data = await getActiveStaff();
      setActiveStaff(data.users);
      setStaffCount(data.count);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load active staff"));
    } finally {
      setStaffActiveLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchComplaints();
    void fetchPendingUsers();
    void fetchActiveCitizens();
    void fetchPendingStaff();
    void fetchActiveStaff();
    // Auto-refresh all data every 5 seconds
    const interval = setInterval(() => {
      fetchComplaints();
      fetchPendingUsers();
      fetchActiveCitizens();
      fetchPendingStaff();
      fetchActiveStaff();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchComplaints, fetchPendingUsers, fetchActiveCitizens, fetchPendingStaff, fetchActiveStaff]);

  useEffect(() => {
    if (section === "users") void fetchPendingUsers();
    if (section === "active") void fetchActiveCitizens();
    if (section === "staff-pending") void fetchPendingStaff();
    if (section === "staff-active") void fetchActiveStaff();
  }, [section, fetchPendingUsers, fetchActiveCitizens, fetchPendingStaff, fetchActiveStaff]);

  const handleApprove = async (userId: string) => {
    setApprovalBusy(userId);
    try {
      await approveUser(userId);
      toast.success("User approved successfully");
      await Promise.all([fetchPendingUsers(), fetchActiveCitizens()]);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to approve user"));
    } finally {
      setApprovalBusy(null);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = rejectReasons[userId]?.trim();
    if (!reason) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setApprovalBusy(userId);
    try {
      await rejectUser(userId, reason);
      toast.success("User rejected");
      setRejectReasons((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      await fetchPendingUsers();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reject user"));
    } finally {
      setApprovalBusy(null);
    }
  };

  const handleApproveStaff = async (userId: string) => {
    setApprovalBusy(userId);
    try {
      const designation = staffDesignations[userId]?.trim();
      const citiesStr = staffAssignedCities[userId]?.trim();
      const assignedCities = citiesStr ? citiesStr.split(',').map(c => c.trim()) : [];
      await approveStaff(userId, designation || undefined, assignedCities.length > 0 ? assignedCities : undefined);
      toast.success("Staff approved successfully");
      await Promise.all([fetchPendingStaff(), fetchActiveStaff()]);
      setStaffDesignations(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setStaffAssignedCities(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to approve staff"));
    } finally {
      setApprovalBusy(null);
    }
  };

  const handleRejectStaff = async (userId: string) => {
    const reason = rejectReasons[userId]?.trim();
    if (!reason) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setApprovalBusy(userId);
    try {
      await rejectStaff(userId, reason);
      toast.success("Staff rejected");
      setRejectReasons((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      await fetchPendingStaff();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reject staff"));
    } finally {
      setApprovalBusy(null);
    }
  };

  const handleApprovePendingResolution = async (complaintId: string) => {
    setPendingResolutionBusy(complaintId);
    try {
      await approvePendingResolution(complaintId);
      toast.success("Resolution approved, complaint marked as resolved");
      fetchComplaints();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to approve resolution"));
    } finally {
      setPendingResolutionBusy(null);
    }
  };

  const handleRejectPendingResolution = async (complaintId: string) => {
    setPendingResolutionBusy(complaintId);
    try {
      await rejectPendingResolution(complaintId);
      toast.success("Resolution rejected, complaint sent back to staff");
      fetchComplaints();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reject resolution"));
    } finally {
      setPendingResolutionBusy(null);
    }
  };

  const total = list.length;
  const pending = list.filter((c) => c.status === "pending").length;
  const assigned = list.filter((c) => c.status === "assigned").length;
  const resolutionPending = list.filter((c) => c.status === "resolution_pending").length;
  const resolved = list.filter((c) => c.status === "resolved").length;

  const filtered =
    filter === "all" ? list : list.filter((c) => c.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-8">
        {/* Hero — matches citizen orange → navy gradient */}
        <section className="mb-8 overflow-hidden rounded-2xl gradient-hero p-6 text-primary-foreground shadow-elegant sm:p-8">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 opacity-90" />
            <div>
              <p className="text-sm opacity-90">Administrator Portal</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                Welcome, {adminUser?.name || "Admin"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm opacity-90">
                Manage citizen approvals, monitor active users, and resolve
                complaints across the city.
              </p>
            </div>
          </div>
        </section>

        <Tabs
          value={section}
          onValueChange={(v) => setSection(v as typeof section)}
          className="mb-8"
        >
          <TabsList className="mb-2 grid h-auto w-full max-w-4xl grid-cols-5 gap-1 bg-white/80 p-1 shadow-sm ring-1 ring-border">
            <TabsTrigger
              value="complaints"
              className="data-[state=active]:gradient-saffron data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              Complaints
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="gap-1.5 data-[state=active]:gradient-saffron data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              Pending Users
              {pendingUsers.length > 0 && (
                <span className="ml-0.5 rounded-full bg-navy/90 px-1.5 py-0.5 text-[10px] text-navy-foreground">
                  {pendingUsers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="gap-1.5 data-[state=active]:gradient-saffron data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <UserCheck className="h-4 w-4" />
              Active Citizens
            </TabsTrigger>
            <TabsTrigger
              value="staff-pending"
              className="gap-1.5 data-[state=active]:gradient-saffron data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4" />
              Pending Staff
              {pendingStaff.length > 0 && (
                <span className="ml-0.5 rounded-full bg-navy/90 px-1.5 py-0.5 text-[10px] text-navy-foreground">
                  {pendingStaff.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="staff-active"
              className="gap-1.5 data-[state=active]:gradient-saffron data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <UserCheck className="h-4 w-4" />
              Active Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="complaints" className="mt-6">
            <section className="mb-8 grid gap-4 sm:grid-cols-5">
              <StatCard
                label="Active Citizens"
                value={activeCount}
                icon={<Users className="h-5 w-5" />}
                tone="navy"
              />
              <StatCard
                label="Total Complaints"
                value={total}
                icon={<Inbox className="h-5 w-5" />}
                tone="primary"
              />
              <StatCard
                label="Pending"
                value={pending}
                icon={<Clock className="h-5 w-5" />}
                tone="pending"
              />
              <StatCard
                label="Assigned"
                value={assigned}
                icon={<UserCog className="h-5 w-5" />}
                tone="primary"
              />
              <StatCard
                label="Resolution Pending"
                value={resolutionPending}
                icon={<Hourglass className="h-5 w-5" />}
                tone="pending"
              />
              <StatCard
                label="Resolved"
                value={resolved}
                icon={<CheckCircle2 className="h-5 w-5" />}
                tone="resolved"
              />
            </section>



            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-navy">
                  Complaint Management
                </h2>
                <TabsList className="bg-white/80 ring-1 ring-border">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value="assigned"
                    className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Assigned
                  </TabsTrigger>
                  <TabsTrigger
                    value="resolution_pending"
                    className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Resolution Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value="resolved"
                    className="data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Resolved
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={filter} className="mt-0">
                {loading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : filtered.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground">
                        No complaints in this view
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((c) => (
                      <AdminComplaintCard
                        key={c.id}
                        c={c}
                        onChange={fetchComplaints}
                        activeStaff={activeStaff}
                        onApprovePending={handleApprovePendingResolution}
                        onRejectPending={handleRejectPendingResolution}
                        pendingBusy={pendingResolutionBusy}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <h2 className="mb-1 text-lg font-semibold text-navy">
              Active Citizens
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Citizens who completed email verification and were approved by an
              administrator (<strong>{activeCount}</strong> total).
            </p>

            {activeLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : activeCitizens.length === 0 ? (
              <Card className="border-dashed border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <UserCheck className="mb-3 h-10 w-10 text-primary/60" />
                  <p className="font-medium text-foreground">
                    No active citizens yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Approved citizens will appear here after you approve them in
                    the Pending tab.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeCitizens.map((u) => (
                  <Card
                    key={u.id}
                    className="overflow-hidden border-border/60 shadow-sm ring-1 ring-primary/10"
                  >
                    <div className="h-1 gradient-saffron" />
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-navy text-sm font-bold text-navy-foreground">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">
                            {u.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-status-resolved-bg px-2.5 py-0.5 text-xs font-medium text-status-resolved">
                        <UserCheck className="h-3 w-3" />
                        Active
                      </span>
                      {u.createdAt && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <h2 className="mb-4 text-lg font-semibold text-navy">
              Citizen Account Approvals
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Users who have verified their email and are awaiting approval to
              access the citizen portal.
            </p>

            {usersLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : pendingUsers.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium text-foreground">
                    No pending user approvals
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((u) => (
                  <Card key={u.id} className="border-border/60 shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {u.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {u.email}
                        </p>
                        {u.createdAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Registered{" "}
                            {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:min-w-[280px]">
                        <Input
                          placeholder="Rejection reason (required to reject)"
                          value={rejectReasons[u.id] || ""}
                          onChange={(e) =>
                            setRejectReasons((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            disabled={approvalBusy === u.id}
                            onClick={() => handleApprove(u.id)}
                            className="gradient-saffron text-primary-foreground hover:opacity-90"
                          >
                            <UserCheck className="mr-1.5 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={approvalBusy === u.id}
                            onClick={() => handleReject(u.id)}
                          >
                            <UserX className="mr-1.5 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff-pending" className="mt-6">
            <h2 className="mb-4 text-lg font-semibold text-navy">
              Staff Account Approvals
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Staff who have registered and are awaiting approval.
            </p>

            {staffPendingLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : pendingStaff.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium text-foreground">
                    No pending staff approvals
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingStaff.map((u) => (
                  <Card key={u.id} className="border-border/60 shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {u.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {u.email}
                        </p>
                        {u.createdAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Registered{" "}
                            {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:min-w-[320px]">
                        <Input
                          placeholder="Designation (optional)"
                          value={staffDesignations[u.id] || ""}
                          onChange={(e) =>
                            setStaffDesignations((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Assigned cities (comma separated, e.g., Patna, Gaya)"
                          value={staffAssignedCities[u.id] || ""}
                          onChange={(e) =>
                            setStaffAssignedCities((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Rejection reason (required to reject)"
                          value={rejectReasons[u.id] || ""}
                          onChange={(e) =>
                            setRejectReasons((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            disabled={approvalBusy === u.id}
                            onClick={() => handleApproveStaff(u.id)}
                            className="gradient-saffron text-primary-foreground hover:opacity-90"
                          >
                            <UserCheck className="mr-1.5 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={approvalBusy === u.id}
                            onClick={() => handleRejectStaff(u.id)}
                          >
                            <UserX className="mr-1.5 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="staff-active" className="mt-6">
            <h2 className="mb-1 text-lg font-semibold text-navy">
              Active Staff
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Staff who have been approved by an administrator (<strong>{staffCount}</strong> total).
            </p>

            {staffActiveLoading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : activeStaff.length === 0 ? (
              <Card className="border-dashed border-primary/20">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <UserCheck className="mb-3 h-10 w-10 text-primary/60" />
                  <p className="font-medium text-foreground">
                    No active staff yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Approved staff will appear here after you approve them in
                    the Pending Staff tab.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeStaff.map((u) => (
                  <Card
                    key={u.id}
                    className="overflow-hidden border-border/60 shadow-sm ring-1 ring-primary/10"
                  >
                    <div className="h-1 gradient-saffron" />
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-navy text-sm font-bold text-navy-foreground">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">
                            {u.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-status-resolved-bg px-2.5 py-0.5 text-xs font-medium text-status-resolved">
                        <UserCheck className="h-3 w-3" />
                        Active
                      </span>
                      {u.designation && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Designation:</span> {u.designation}
                        </p>
                      )}
                      {u.assignedCities && u.assignedCities.length > 0 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium">Assigned cities:</span> {u.assignedCities.join(", ")}
                        </p>
                      )}
                      {u.createdAt && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <AppFooter />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "primary" | "pending" | "resolved" | "navy";
}) {
  const styles = {
    primary: "bg-primary/10 text-primary",
    navy: "gradient-navy text-navy-foreground",
    pending: "bg-status-pending-bg text-status-pending",
    resolved: "bg-status-resolved-bg text-status-resolved",
  }[tone];
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles}`}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminComplaintCard({
  c,
  onChange,
  activeStaff,
  onApprovePending,
  onRejectPending,
  pendingBusy,
}: {
  c: Complaint;
  onChange: () => void;
  activeStaff: User[];
  onApprovePending: (id: string) => void;
  onRejectPending: (id: string) => void;
  pendingBusy: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>("");

  const onUploadAfter = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("afterImage", file);
      await uploadAfterImage(c.id, formData);
      toast.success("After-work image uploaded");
      onChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const onResolve = async () => {
    if (!c.afterImageUrl) {
      toast.error("Upload an after-work image before resolving");
      return;
    }
    setBusy(true);
    try {
      await resolveComplaint(c.id);
      toast.success("Complaint marked as resolved");
      onChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to resolve complaint");
    } finally {
      setBusy(false);
    }
  };

  const onAssign = async () => {
    if (!selectedStaff) {
      toast.error("Select a staff member first");
      return;
    }
    setBusy(true);
    try {
      await assignComplaintToStaff(c.id, selectedStaff);
      toast.success("Complaint assigned to staff");
      onChange();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign complaint");
    } finally {
      setBusy(false);
    }
  };

  const isResolved = c.status === "resolved";
  const isResolutionPending = c.status === "resolution_pending";

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm transition-base hover:shadow-md">
      <div className="grid grid-cols-2">
        <figure className="relative">
          <SafeImage
            src={c.beforeImageUrl}
            alt="Before"
            className="h-40 w-full"
            fallbackText="No before image"
          />
          <figcaption className="absolute bottom-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
            Before
          </figcaption>
        </figure>
        <figure 
          className={`relative bg-muted ${(!c.afterImageUrl && !isResolutionPending && !isResolved) ? "cursor-pointer hover:bg-muted/80" : ""}`}
          onClick={() => {
            if (!c.afterImageUrl && !isResolutionPending && !isResolved) {
              fileRef.current?.click();
            }
          }}
        >
          {c.afterImageUrl ? (
            <>
              <SafeImage
                src={c.afterImageUrl}
                alt="After"
                className="h-40 w-full"
                fallbackText="No after image"
              />
              <figcaption className="absolute bottom-1.5 left-1.5 rounded bg-success px-1.5 py-0.5 text-[10px] font-semibold uppercase text-success-foreground">
                After
              </figcaption>
            </>
          ) : isResolutionPending && c.pendingAfterImageUrl ? (
            <>
              <SafeImage
                src={c.pendingAfterImageUrl}
                alt="Pending"
                className="h-40 w-full"
                fallbackText="No pending image"
              />
              <figcaption className="absolute bottom-1.5 left-1.5 rounded bg-yellow-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                Pending
              </figcaption>
            </>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
              Click to add photo
            </div>
          )}
        </figure>
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {c.category}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <MapPin className="h-3.5 w-3.5" />
              {c.location.city}, {c.location.district}
            </div>
            <div className="text-xs text-muted-foreground">{c.address}</div>
          </div>
          <StatusBadge status={c.status} />
        </div>

        <p className="line-clamp-3 text-sm text-foreground">{c.description}</p>

        <div className="space-y-1 border-t pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            <span className="truncate">{c.userEmail}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {new Date(c.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
          {c.assignedStaff && (
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3 w-3" />
              <span>Assigned to: {c.assignedStaff.name}</span>
            </div>
          )}
          {isResolutionPending && c.pendingSubmittedBy && (
            <div className="flex items-center gap-1.5">
              <Hourglass className="h-3 w-3" />
              <span>Submitted by: Staff (ID: {c.pendingSubmittedBy})</span>
            </div>
          )}
        </div>

        {!isResolved && !isResolutionPending && (
          <div className="space-y-2 pt-1">
            {/* Assignment Section - Prominent */}
            <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <UserCog className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Assign Complaint</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Select
                  value={selectedStaff}
                  onValueChange={setSelectedStaff}
                  disabled={busy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} {staff.designation ? `(${staff.designation})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || !selectedStaff}
                  onClick={onAssign}
                  className="gradient-saffron text-primary-foreground hover:opacity-90 disabled:opacity-50 w-full"
                >
                  <UserCog className="mr-1.5 h-4 w-4" />
                  Assign to Staff
                </Button>
              </div>
            </div>

            {/* Resolve Section */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="mr-1.5 h-4 w-4" />
                {c.afterImageUrl ? "Replace" : "Upload"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy || !c.afterImageUrl}
                onClick={onResolve}
                className="gradient-green text-success-foreground hover:opacity-90 disabled:opacity-50"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Resolve
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUploadAfter}
            />
          </div>
        )}

        {isResolutionPending && (
          <div className="space-y-2 pt-1">
            <div className="border border-yellow-500/30 rounded-lg p-3 bg-yellow-50">
              <div className="flex items-center gap-2 mb-3">
                <Hourglass className="h-4 w-4 text-yellow-700" />
                <span className="text-sm font-semibold text-yellow-800">Resolution Pending Approval</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pendingBusy === c.id}
                  onClick={() => onApprovePending(c.id)}
                  className="gradient-green text-success-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <ThumbsUp className="mr-1.5 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={pendingBusy === c.id}
                  onClick={() => onRejectPending(c.id)}
                >
                  <ThumbsDown className="mr-1.5 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
