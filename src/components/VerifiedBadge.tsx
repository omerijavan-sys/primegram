import { BadgeCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  isVerified?: boolean | null;
  isOfficial?: boolean | null;
  className?: string;
}

/** Blue verified tick, or the tri-colour official Primegram shield. */
const VerifiedBadge = ({ isVerified, isOfficial, className }: VerifiedBadgeProps) => {
  if (isOfficial) {
    return (
      <span
        title="Official Primegram account"
        className={cn("inline-flex items-center align-middle", className)}
      >
        <ShieldCheck className="h-4 w-4 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]" />
      </span>
    );
  }
  if (!isVerified) return null;
  return (
    <span title="Verified" className={cn("inline-flex items-center align-middle", className)}>
      <BadgeCheck className="h-4 w-4 text-primary" />
    </span>
  );
};

export default VerifiedBadge;
