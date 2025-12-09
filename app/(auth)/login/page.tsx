import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Scribe & Stem",
  description: "Access your intelligent wedding planning dashboard.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Editorial */}
      <div className="hidden lg:flex w-1/2 bg-primary relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary" />
        
        <div className="relative z-10 max-w-lg text-white text-center space-y-6">
          <h2 className="font-serif text-5xl md:text-6xl leading-tight text-white">
            &quot;Love is composed of a single soul inhabiting two bodies.&quot;
          </h2>
          <p className="font-sans text-lg opacity-80 font-light tracking-wide uppercase">— Aristotle</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative">
        <Link 
          href="/" 
          className="absolute top-8 left-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="w-full max-w-md">
          <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}