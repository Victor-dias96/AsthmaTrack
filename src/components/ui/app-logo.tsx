import { Wind } from "lucide-react";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: { icon: 14, text: "text-base", container: "size-7", gap: "gap-2" },
  md: { icon: 18, text: "text-xl", container: "size-9", gap: "gap-2.5" },
  lg: { icon: 22, text: "text-2xl", container: "size-11", gap: "gap-3" },
};

export function AppLogo({ size = "md", className }: AppLogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-[var(--at-blue)] shrink-0",
          s.container
        )}
      >
        <Wind size={s.icon} className="text-white" strokeWidth={2} />
      </div>
      <span
        className={cn("font-semibold text-[var(--at-text-on-navy)]", s.text)}
      >
        AsthmaTrack
      </span>
    </div>
  );
}
