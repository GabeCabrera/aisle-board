import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth/config";
import { getTenantById, getPlannerByTenantId, getPagesByPlannerId } from "@/lib/db/queries";
import { HomeClient } from "./home-client";

function getSubdomain(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");
  
  // Development: sarahandgabe.localhost -> subdomain is "sarahandgabe"
  // localhost alone -> no subdomain
  if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") {
    return null;
  }
  
  // Check if it's a .localhost subdomain (dev)
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0];
  }
  
  // Production: sarahandgabe.aisle.wedding -> subdomain is "sarahandgabe"
  // aisle.wedding -> no subdomain
  if (parts.length > 2 && parts[0] !== "www") {
    return parts[0];
  }
  
  return null;
}

export default async function HomePage() {
  const headersList = headers();
  const host = headersList.get("host") || "";
  const subdomain = getSubdomain(host);
  
  console.log("Host:", host, "Subdomain:", subdomain);

  // If no subdomain, show marketing/landing page
  if (!subdomain) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-px bg-warm-400 mx-auto mb-8" />
          
          <h1 className="text-5xl font-serif font-light tracking-widest uppercase mb-2">
            Aisle
          </h1>
          <p className="text-sm tracking-[0.3em] uppercase text-warm-500 mb-12">
            Wedding Planner
          </p>
          
          <div className="w-16 h-px bg-warm-400 mx-auto mb-12" />
          
          <Link
            href="/login"
            className="inline-block px-8 py-3 border border-warm-400 text-warm-600 
                       tracking-widest uppercase text-sm hover:bg-warm-50 
                       transition-colors duration-300"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  // We have a subdomain - this is a tenant site
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const tenant = await getTenantById(session.user.tenantId);

  if (!tenant) {
    redirect("/login");
  }

  // If onboarding not complete, redirect to welcome
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
