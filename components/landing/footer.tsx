import Link from "next/link";

const links = [
  { name: "Blog", href: "/blog" },
  { name: "Login", href: "/login" },
  { name: "Register", href: "/register" },
  { name: "Pricing", href: "/choose-plan" },
];

const legal = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border bg-muted/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div className="text-center md:text-left">
          <span className="font-serif text-xl font-medium tracking-tight block mb-2">Scribe & Stem</span>
          <p className="text-sm text-muted-foreground">
            The intelligent operating system for your wedding.
          </p>
        </div>

        <div className="flex gap-8 text-sm font-medium">
          {links.map((link) => (
            <Link key={link.name} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex gap-8 text-sm">
          {legal.map((link) => (
            <Link key={link.name} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
              {link.name}
            </Link>
          ))}
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Scribe & Stem Inc. All rights reserved.
      </div>
    </footer>
  );
}
