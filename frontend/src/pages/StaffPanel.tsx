import { useRef, useState, ChangeEvent } from "react";
import {
  Image as ImageIcon,
  X,
  Calendar,
  CheckCircle,
  MapPin,
  Hourglass,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { StatusBadge } from "@/components/StatusBadge";
import { SafeImage } from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getAssignedComplaints, submitPendingResolution } from "@/api/complaints";
import { toast } from "sonner";
import { useEffect } from "react";
import type { Complaint } from "@/types/app";

export default function StaffPanel() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [actuallySubmitting, setActuallySubmitting] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string>("");
  const [afterImageFile, setAfterImageFile] = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComplaints();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchComplaints, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchComplaints = async () => {
    try {
      const data = await getAssignedComplaints();
      setComplaints(data.complaints);
    } catch (error) {
      toast.error("Failed to load assigned complaints");
    } finally {
      setFetching(false);
    }
  };

  const onPickAfterImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAfterImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAfterImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startSubmission = (id: string) => {
    setSubmittingId(id);
    // Wait for next tick to open file dialog
    setTimeout(() => {
      fileRef.current?.click();
    }, 0);
  };

  const onSubmitResolution = async () => {
    if (!submittingId) return;
    if (!afterImageFile) {
      toast.error("Please upload an after photo");
      return;
    }
    setActuallySubmitting(submittingId);
    try {
      const formData = new FormData();
      formData.append("afterImage", afterImageFile);
      await submitPendingResolution(submittingId, formData);
      toast.success("Resolution submitted for admin approval");
      setSubmittingId(null);
      setActuallySubmitting(null);
      setAfterImage("");
      setAfterImageFile(null);
      fetchComplaints();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit resolution";
      toast.error(message);
      setActuallySubmitting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-8">
        {/* Hero */}
        <section className="mb-8 overflow-hidden rounded-2xl gradient-hero p-6 text-primary-foreground shadow-elegant sm:p-8">
          <p className="text-sm opacity-90">Welcome,</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{user?.name}</h1>
          {user?.designation && (
            <p className="mt-1 text-sm opacity-90">{user.designation}</p>
          )}
          {user?.assignedCities && user.assignedCities.length > 0 && (
            <p className="mt-1 text-xs opacity-80">
              Assigned: {user.assignedCities.join(", ")}
            </p>
          )}
          <p className="mt-2 max-w-xl text-sm opacity-90">
            Submit resolution evidence for complaints assigned to your cities.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
            <Stat label="Assigned" value={complaints.length} />
            <Stat label="Pending" value={complaints.filter(c => c.status === "pending" || c.status === "assigned").length} />
            <Stat label="In Review" value={complaints.filter(c => c.status === "resolution_pending").length} />
          </div>
        </section>

        <div className="grid gap-6">
          {/* Assigned Complaints */}
          <div>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Assigned Complaints
                </h2>
                <p className="text-sm text-muted-foreground">
                  {complaints.length} complaint{complaints.length !== 1 && "s"}
                </p>
              </div>
            </div>

            {complaints.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <CheckCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">
                    No complaints assigned
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    You're all caught up! No pending complaints in your assigned cities.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {complaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    c={c}
                    isSubmitting={submittingId === c.id}
                    afterImage={submittingId === c.id ? afterImage : ""}
                    onPickAfterImage={submittingId === c.id ? onPickAfterImage : undefined}
                    startSubmission={() => startSubmission(c.id)}
                    onSubmitResolution={onSubmitResolution}
                    onCancel={() => {
                      setSubmittingId(null);
                      setAfterImage("");
                      setAfterImageFile(null);
                    }}
                    fileRef={fileRef}
                    setAfterImage={setAfterImage}
                    setAfterImageFile={setAfterImageFile}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur-sm">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-90">{label}</p>
    </div>
  );
}

function ComplaintCard({
  c,
  isSubmitting,
  afterImage,
  onPickAfterImage,
  startSubmission,
  onSubmitResolution,
  onCancel,
  fileRef,
  setAfterImage,
  setAfterImageFile,
}: {
  c: Complaint;
  isSubmitting: boolean;
  afterImage: string;
  onPickAfterImage?: (e: ChangeEvent<HTMLInputElement>) => void;
  startSubmission: () => void;
  onSubmitResolution: () => void;
  onCancel: () => void;
  fileRef: React.RefObject<HTMLInputElement>;
  setAfterImage: (value: string) => void;
  setAfterImageFile: (value: File | null) => void;
}) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm transition-base hover:shadow-md">
      <div className="grid grid-cols-2">
        <figure className="relative">
          <SafeImage
            src={c.beforeImageUrl}
            alt="Before"
            className="h-32 w-full"
            fallbackText="No before image"
          />
          <figcaption className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
            Before
          </figcaption>
        </figure>
        <figure 
          className={`relative bg-muted ${(!c.afterImageUrl && !c.pendingAfterImageUrl && !isSubmitting && (c.status.toLowerCase() === "pending" || c.status.toLowerCase() === "assigned")) ? "cursor-pointer hover:bg-muted/80" : ""}`}
          onClick={() => {
            if (!c.afterImageUrl && !c.pendingAfterImageUrl && !isSubmitting && (c.status.toLowerCase() === "pending" || c.status.toLowerCase() === "assigned")) {
              startSubmission();
            }
          }}
        >
          {isSubmitting && afterImage ? (
            <>
              <SafeImage
                src={afterImage}
                alt="After (preview)"
                className="h-32 w-full"
                fallbackText="No after image"
              />
              <figcaption className="absolute bottom-1 left-1 rounded bg-orange-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                After (Preview)
              </figcaption>
            </>
          ) : c.pendingAfterImageUrl ? (
            <>
              <SafeImage
                src={c.pendingAfterImageUrl}
                alt="Pending"
                className="h-32 w-full"
                fallbackText="No pending image"
              />
              <figcaption className="absolute bottom-1 left-1 rounded bg-yellow-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                Pending
              </figcaption>
            </>
          ) : c.afterImageUrl ? (
            <>
              <SafeImage
                src={c.afterImageUrl}
                alt="After"
                className="h-32 w-full"
                fallbackText="No after image"
              />
              <figcaption className="absolute bottom-1 left-1 rounded bg-success px-1.5 py-0.5 text-[10px] font-semibold uppercase text-success-foreground">
                After
              </figcaption>
            </>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
              Click to add photo
            </div>
          )}
        </figure>
      </div>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {c.category}
          </span>
          <StatusBadge status={c.status} />
        </div>
        <div className="space-y-1 text-xs font-medium text-primary">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {c.location.city}, {c.location.district}
          </div>
          <div>{c.address}</div>
        </div>
        <p className="line-clamp-2 text-sm text-foreground">{c.description}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(c.createdAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </div>

        {(c.status.toLowerCase() === "pending" || c.status.toLowerCase() === "assigned") && (
          <div className="pt-2">
            {isSubmitting ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>After Photo (Required)</Label>
                  {afterImage ? (
                    <div className="relative overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={afterImage}
                        alt="After preview"
                        className="h-32 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAfterImage("");
                          setAfterImageFile(null);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow hover:bg-background"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center py-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileRef.current?.click()}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Upload After Photo
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickAfterImage}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                    onClick={onSubmitResolution}
                  >
                    <Hourglass className="mr-2 h-4 w-4" />
                    Submit For Review
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                className="w-full bg-orange-600 text-white hover:bg-orange-700"
                onClick={startSubmission}
              >
                Submit Resolution
              </Button>
            )}
          </div>
        )}
        {c.status.toLowerCase() === "resolution_pending" && (
          <div className="pt-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-medium text-yellow-800">
              <Hourglass className="h-3.5 w-3.5" />
              <span>Resolution pending admin review</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
