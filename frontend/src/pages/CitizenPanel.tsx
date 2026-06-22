import { useRef, useState, ChangeEvent, FormEvent } from "react";
import {
  Camera,
  Image as ImageIcon,
  Send,
  X,
  Calendar,
  FileText,
  MapPin,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { createComplaint, getMyComplaints } from "@/api/complaints";
import { toast } from "sonner";
import { useEffect } from "react";
import type { ComplaintCategory, Complaint } from "@/types/app";

const CATEGORIES: ComplaintCategory[] = [
  "Garbage Collection",
  "Street Light",
  "Road Repair",
  "Water Supply",
  "Drainage/Sewage",
  "Stray Animals",
  "Public Toilets",
  "Encroachment",
  "Park Maintenance",
  "Others",
];

const DISTRICTS = [
  "Patna",
  "Gaya",
  "Bhagalpur",
  "Muzaffarpur",
  "Purnia",
  "Darbhanga",
  "Arrah",
  "Begusarai",
  "Katihar",
  "Munger",
  "Saran",
  "Saharsa",
  "Bettiah",
  "Motihari",
];

const CITIES: Record<string, string[]> = {
  Patna: [
    "Patna City",
    "Danapur",
    "Khagaul",
    "Phulwari Sharif",
    "Maner",
    "Masaurhi",
  ],
  Gaya: ["Gaya City", "Bodh Gaya", "Sherghati", "Tekari", "Belaganj"],
  Bhagalpur: ["Bhagalpur City", "Colgong", "Sultanganj", "Naugachhia"],
  Muzaffarpur: ["Muzaffarpur City", "Motipur", "Kanti", "Sahebganj"],
  Purnia: ["Purnia City", "Kasba", "Banmankhi", "Dhamdaha"],
  Darbhanga: ["Darbhanga City", "Benipur", "Baheri", "Hayaghat"],
  Arrah: ["Arrah City", "Jagdishpur", "Piro", "Behea"],
  Begusarai: ["Begusarai City", "Barauni", "Teghra", "Ballia"],
  Katihar: ["Katihar City", "Barsoi", "Manihari", "Korha"],
  Munger: ["Munger City", "Jamalpur", "Haveli Kharagpur", "Tarapur"],
  Saran: ["Chhapra", "Sonpur", "Dighwara", "Revelganj"],
  Saharsa: ["Saharsa City", "Simri Bakhtiarpur", "Bangon"],
  Bettiah: ["Bettiah City", "Narkatiaganj", "Bagaha", "Chanpatia"],
  Motihari: ["Motihari City", "Raxaul", "Dhaka", "Chakia"],
};

export default function CitizenPanel() {
  const { user } = useAuth();
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [history, setHistory] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHistory();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getMyComplaints();
      setHistory(data.complaints);
    } catch (error) {
      toast.error("Failed to load complaint history");
    } finally {
      setFetching(false);
    }
  };

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!category) return toast.error("Please select a category");
    if (!district) return toast.error("Please select a district");
    if (!city) return toast.error("Please select a city/village");
    if (!address.trim()) return toast.error("Please enter the full address");
    if (!description.trim()) return toast.error("Please add a description");
    if (!imageFile) return toast.error("Please attach a photo of the issue");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("district", district);
      formData.append("city", city);
      formData.append("address", address.trim());
      formData.append("description", description.trim());
      formData.append("beforeImage", imageFile);

      await createComplaint(formData);
      toast.success("Complaint submitted successfully");
      setCategory("");
      setDistrict("");
      setCity("");
      setAddress("");
      setDescription("");
      setImageFile(null);
      setImagePreview("");
      fetchHistory();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit complaint";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const pending = history.filter(
    (c) => c.status.toLowerCase() === "pending",
  ).length;
  const resolved = history.filter(
    (c) => c.status.toLowerCase() === "resolved",
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-8">
        {/* Hero */}
        <section className="mb-8 overflow-hidden rounded-2xl gradient-hero p-6 text-primary-foreground shadow-elegant sm:p-8">
          <p className="text-sm opacity-90">Welcome,</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{user?.name}</h1>
          <p className="mt-2 max-w-xl text-sm opacity-90">
            Report civic issues in your area. Track progress and view results
            posted by the municipal team.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
            <Stat label="Total" value={history.length} />
            <Stat label="Pending" value={pending} />
            <Stat label="Resolved" value={resolved} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Raise complaint */}
          <Card className="border-border/60 shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Raise a Complaint
              </CardTitle>
              <CardDescription>
                Provide details and a photo of the issue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as ComplaintCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>District</Label>
                    <Select
                      value={district}
                      onValueChange={(v) => {
                        setDistrict(v);
                        setCity("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="District" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISTRICTS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>City/Village</Label>
                    <Select
                      value={city}
                      onValueChange={setCity}
                      disabled={!district}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="City/Village" />
                      </SelectTrigger>
                      <SelectContent>
                        {district &&
                          CITIES[district]?.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, colony, landmark or building name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photo evidence</Label>
                  {imagePreview ? (
                    <div className="relative overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={imagePreview}
                        alt="Complaint preview"
                        className="h-48 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                        className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 text-foreground shadow hover:bg-background"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center py-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileRef.current?.click()}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickImage}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-saffron text-primary-foreground hover:opacity-90"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Complaint
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* History */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Complaint History
                </h2>
                <p className="text-sm text-muted-foreground">
                  {history.length} total submission{history.length !== 1 && "s"}
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">
                    No complaints yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Submit your first complaint using the form on the left.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {history.map((c) => (
                  <ComplaintCard key={c.id} c={c} />
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

function ComplaintCard({ c }: { c: Complaint }) {
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
        <figure className="relative bg-muted">
          {c.afterImageUrl ? (
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
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
              Awaiting resolution
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
      </CardContent>
    </Card>
  );
}
