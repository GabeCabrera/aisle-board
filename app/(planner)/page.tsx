import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth/config";
import { getTenantById, getPlannerByTenantId, getPagesByPlannerId } from "@/lib/db/queries";
import { HomeClient } from "./home-client";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  // If not logged in, show marketing/landing page
  if (!session?.user?.tenantId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-px bg-warm-400 mx-auto mb-8" />
          
          <h1 className="text-5xl font-serif font-light tracking-widest uppercase mb-2">
            Aisle
          </h1>
          <p className="text-sm tracking-[0.3em] uppercase text-warm-500 mb-8">
            Wedding Planner
          </p>
          
          <p className="text-warm-600 mb-12 leading-relaxed">
            Plan your perfect day with elegance and ease. 
            Beautiful templates, powerful tools, and everything 
            you need in one place.
          </p>
          
          <div className="w-16 h-px bg-warm-400 mx-auto mb-12" />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-warm-600 text-white
                         tracking-widest uppercase text-sm hover:bg-warm-700 
                         transition-colors duration-300"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-block px-8 py-3 border border-warm-400 text-warm-600 
                         tracking-widest uppercase text-sm hover:bg-warm-50 
                         transition-colors duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // User is logged in - get their tenant
  const tenant = await getTenantById(session.user.tenantId);

  if (!tenant) {
    redirect("/login");
  }

  // If plan not selected yet, redirect to choose plan
  if (tenant.plan === "free" && !tenant.onboardingComplete) {
    redirect("/choose-plan");
  }

  // If onboarding not complete (paid users), redirect to welcome
  if (!tenant.onboardingComplete) {
    redirect("/welcome");
  }

  // Check if they have a planner with pages
  const planner = await getPlannerByTenantId(tenant.id);
  const pages = planner ? await getPagesByPlannerId(planner.id) : [];
  const hasStartedPlanning = pages.length > 0;

  return (
    <HomeClient
      displayName={tenant.displayName}
      hasStartedPlanning={hasStartedPlanning}
    />
  );
}
