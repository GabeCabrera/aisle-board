import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Aisle",
  description: "Privacy policy for Aisle wedding planning platform",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="py-8 px-8 border-b border-warm-200">
        <div className="max-w-3xl mx-auto">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-warm-600 hover:text-warm-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm tracking-wider">Back to Home</span>
          </Link>
          <h1 className="text-3xl font-serif font-light tracking-wide text-warm-800">
            Privacy Policy
          </h1>
          <p className="text-warm-500 text-sm mt-2">
            Last updated: December 1, 2025
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="py-12 px-8">
        <div className="max-w-3xl mx-auto prose prose-warm">
          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Introduction
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              At Aisle (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our wedding planning platform at aisleboard.com.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Information We Collect
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-warm-600 space-y-2 mb-4">
              <li>Account information (name, email address, password)</li>
              <li>Wedding details (names, wedding date, venue information)</li>
              <li>Guest list and RSVP information</li>
              <li>Budget and vendor information</li>
              <li>Calendar events and scheduling data</li>
              <li>Any other information you choose to provide</li>
            </ul>
            <p className="text-warm-600 leading-relaxed mb-4">
              We automatically collect certain information when you use our service:
            </p>
            <ul className="list-disc list-inside text-warm-600 space-y-2">
              <li>Log data (IP address, browser type, pages visited)</li>
              <li>Device information</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              How We Use Your Information
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-warm-600 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Send you wedding planning tips and updates (with your consent)</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent security incidents</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Google Calendar Integration
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              If you choose to connect your Google Calendar, we request access to create and manage a dedicated wedding calendar. We only access calendar data necessary to sync your wedding events. We do not access your other calendars or personal events unless explicitly shared with your wedding calendar.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Information Sharing
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-warm-600 space-y-2">
              <li>With your consent or at your direction</li>
              <li>With service providers who assist in our operations (hosting, email delivery)</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Data Security
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Your Rights and Choices
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-warm-600 space-y-2">
              <li>Access, update, or delete your personal information</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Disconnect third-party integrations (like Google Calendar)</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Cookies
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              We use cookies and similar technologies to maintain your session, remember your preferences, and understand how you use our service. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Data Retention
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Children&apos;s Privacy
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Changes to This Policy
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Contact Us
            </h2>
            <p className="text-warm-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a 
                href="mailto:hello@aisleboard.com" 
                className="text-warm-700 underline hover:text-warm-900"
              >
                hello@aisleboard.com
              </a>
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-8 bg-warm-100 border-t border-warm-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-serif tracking-widest uppercase text-warm-700 mb-2">
            Aisle
          </p>
          <p className="text-xs text-warm-500">
            © {new Date().getFullYear()} Aisle. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
