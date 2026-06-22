import atmanirbhar from "@/assets/atmanirbhar-bharat.png";

export default function AppFooter() {
  return (
    <footer className="mt-12 border-t bg-card">
      <div className="tricolor-stripe" />
      <div className="container flex flex-col items-center gap-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <img
            src={atmanirbhar}
            alt="Atmanirbhar Bharat"
            width={40}
            height={40}
            className="h-10 w-10"
            loading="lazy"
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">आत्मनिर्भर भारत</p>
            <p className="text-xs text-muted-foreground">Atmanirbhar Bharat · Self-Reliant India</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} URBANRESOLVE · ADITYA SINGH
          <br className="sm:hidden" />
          <span className="hidden sm:inline"> · </span>
          <span className="font-medium text-foreground">जय हिन्द 🇮🇳</span>
        </p>
      </div>
    </footer>
  );
}
