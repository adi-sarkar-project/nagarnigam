import ashokaChakra from "@/assets/ashoka-chakra.png";
import atmanirbhar from "@/assets/atmanirbhar-bharat.png";

interface RedirectLoaderProps {
  message?: string;
}

export default function RedirectLoader({
  message = "Loading your dashboard...",
}: RedirectLoaderProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="absolute left-0 right-0 top-0 tricolor-stripe" />

      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
          <img
            src={ashokaChakra}
            alt="Ashoka Chakra"
            width={112}
            height={112}
            className="relative h-28 w-28 animate-spin-slow"
          />
        </div>

        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">जय हिन्द · Jai Hind</p>
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
          <img
            src={atmanirbhar}
            alt="Atmanirbhar Bharat"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span className="text-xs font-semibold tracking-wide text-foreground">
            ATMANIRBHAR BHARAT
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 tricolor-stripe" />
    </div>
  );
}
