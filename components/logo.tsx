import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  href?: string;
  className?: string;
  variant?: "default" | "white";
}

export function Logo({ size = "md", showText = true, href = "/", className = "", variant = "default" }: LogoProps) {
  const sizes = {
    sm: { icon: "w-7 h-7", text: "text-base", gap: "gap-2" },
    md: { icon: "w-9 h-9", text: "text-lg", gap: "gap-2.5" },
    lg: { icon: "w-11 h-11", text: "text-xl", gap: "gap-3" },
    xl: { icon: "w-14 h-14", text: "text-2xl", gap: "gap-3" },
  };

  const colors = {
    default: {
      primary: "#78716c",
      accent: "#a8a29e",
      text: "text-warm-700",
    },
    white: {
      primary: "#ffffff",
      accent: "#e7e5e4",
      text: "text-white",
    },
  };

  const c = colors[variant];

  const content = (
    <div className={`flex items-center ${sizes[size].gap} ${className}`}>
      {/* Logo Icon - Elegant intertwined rings forming abstract "A" */}
      <div className={`${sizes[size].icon} relative`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Left ring */}
          <circle 
            cx="14" 
            cy="22" 
            r="10" 
            stroke={c.primary}
            strokeWidth="2.5"
            fill="none"
          />
          {/* Right ring */}
          <circle 
            cx="26" 
            cy="22" 
            r="10" 
            stroke={c.primary}
            strokeWidth="2.5"
            fill="none"
          />
          {/* Small heart above - subtle accent */}
          <path 
            d="M20 8 C18.5 6, 16 7, 16 9.5 C16 12, 20 15, 20 15 C20 15, 24 12, 24 9.5 C24 7, 21.5 6, 20 8Z" 
            fill={c.accent}
          />
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`font-serif tracking-[0.15em] uppercase ${c.text} ${sizes[size].text}`}>
          Aisle
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

// Icon only version for tight spaces
export function LogoIcon({ size = "md", className = "", variant = "default" }: { 
  size?: "sm" | "md" | "lg"; 
  className?: string;
  variant?: "default" | "white";
}) {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const colors = {
    default: {
      primary: "#78716c",
      accent: "#a8a29e",
    },
    white: {
      primary: "#ffffff",
      accent: "#e7e5e4",
    },
  };

  const c = colors[variant];

  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle 
          cx="14" 
          cy="22" 
          r="10" 
          stroke={c.primary}
          strokeWidth="2.5"
          fill="none"
        />
        <circle 
          cx="26" 
          cy="22" 
          r="10" 
          stroke={c.primary}
          strokeWidth="2.5"
          fill="none"
        />
        <path 
          d="M20 8 C18.5 6, 16 7, 16 9.5 C16 12, 20 15, 20 15 C20 15, 24 12, 24 9.5 C24 7, 21.5 6, 20 8Z" 
          fill={c.accent}
        />
      </svg>
    </div>
  );
}
