import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RegisterForm } from "@/components/auth/register-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Scribe & Stem",
  description: "Start planning your wedding with AI assistance today.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Editorial (Secondary Theme) */}
      <div className="hidden lg:flex w-1/2 bg-secondary relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 to-secondary" />
        
        <div className="relative z-10 max-w-lg text-white text-center space-y-6">
          <h2 className="font-serif text-5xl md:text-6xl leading-tight text-white">
            &quot;A successful marriage requires falling in love many times, always with the same person.&quot;
          </h2>
          <p className="font-sans text-lg opacity-80 font-light tracking-wide uppercase">— Mignon McLaughlin</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative overflow-y-auto">
        <Link 
          href="/" 
          className="absolute top-8 left-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group z-20"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <div className="w-full max-w-md py-12">
          <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}