import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ashokaChakra from "@/assets/ashoka-chakra.png";
import atmanirbhar from "@/assets/atmanirbhar-bharat.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <>
      <div className="tricolor-stripe" />

      <div className="border-b bg-card">
        <div className="container flex h-8 items-center justify-between text-[11px] sm:text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <img src={ashokaChakra} alt="" width={16} height={16} className="h-4 w-4" loading="lazy" />
            <span className="hidden sm:inline">Government of India</span>
            <span className="sm:hidden">GoI</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">भारत सरकार</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <img src={atmanirbhar} alt="" width={16} height={16} className="h-4 w-4" loading="lazy" />
            <span className="hidden xs:inline">आत्मनिर्भर भारत</span>
            <span className="hidden sm:inline">· Atmanirbhar Bharat</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <div className="container flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-card shadow-md ring-1 ring-border">
              <img src={ashokaChakra} alt="Ashoka Chakra" width={40} height={40} className="h-9 w-9" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground sm:text-base">URBANRESOLVE</p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">
                Complaint Management Portal
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{user.name === "Municipal Admin" ? "Admin" : user.name}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
