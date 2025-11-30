import { db } from "@/lib/db";
import { rsvpForms, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { RsvpFormClient } from "./rsvp-form-client";

interface RsvpPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RsvpPage({ params }: RsvpPageProps) {
  const { slug } = await params;

  // Get the RSVP form
  const [form] = await db
    .select()
    .from(rsvpForms)
    .where(eq(rsvpForms.slug, slug))
    .limit(1);

  if (!form || !form.isActive) {
    notFound();
  }

  // Get tenant info for display
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, form.tenantId))
    .limit(1);

  if (!tenant) {
    notFound();
  }

  return (
    <RsvpFormClient
      form={form}
      coupleNames={tenant.displayName}
      weddingDate={form.weddingDate?.toISOString() || tenant.weddingDate?.toISOString()}
    />
  );
}
