import logo from "@/assets/p-logo-lux.png";

interface PrimeLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Architectural liquid-glass "P" mark with metallic accents.
 */
const PrimeLogo = ({ size = 44, className = "", glow = true }: PrimeLogoProps) => (
  <div
    className={`relative inline-flex items-center justify-center rounded-2xl liquid-glass ${className}`}
    style={{
      width: size,
      height: size,
      boxShadow: glow
        ? "0 0 28px hsla(var(--brand-blue) / 0.28), 0 0 60px hsla(var(--brand-green) / 0.12)"
        : undefined,
    }}
  >
    <img
      src={logo}
      alt="Primegram logo"
      width={size}
      height={size}
      className="relative z-10 object-contain"
      style={{ width: size * 0.68, height: size * 0.68 }}
    />
  </div>
);

export default PrimeLogo;
