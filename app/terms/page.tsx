import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Scribe",
  description: "Terms of service for Scribe wedding planning platform",
};

export default function TermsPage() {
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
            Terms of Service
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
              Agreement to Terms
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              By accessing or using Scribe (&quot;the Service&quot;), operated by Scribe (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) at scribe.wedding, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Description of Service
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              Scribe is a wedding planning platform that provides tools for couples to organize their wedding, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-warm-600 space-y-2">
              <li>Budget tracking and management</li>
              <li>Guest list management and RSVP tracking</li>
              <li>Vendor organization</li>
              <li>Timeline and task planning</li>
              <li>Calendar integration</li>
              <li>Seating chart creation</li>
              <li>And other wedding planning tools</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Account Registration
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              To use certain features of our Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-warm-600 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as needed</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Pricing and Payments
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              Scribe offers both free and paid plans. For paid plans:
            </p>
            <ul className="list-disc list-inside text-warm-600 space-y-2">
              <li>Paid plans are available on monthly or annual subscriptions</li>
              <li>You can cancel your subscription at any time</li>
              <li>All payments are processed securely through Stripe</li>
              <li>Prices are subject to change with notice</li>
              <li>Refunds may be provided at our discretion within 30 days of purchase</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Acceptable Use
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-warm-600 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Upload malicious code or interfere with the Service</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the Service for any fraudulent or deceptive purpose</li>
              <li>Harass, abuse, or harm others</li>
              <li>Send spam or unsolicited communications through the Service</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Your Content
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              You retain ownership of all content you submit to the Service (&quot;Your Content&quot;). By submitting content, you grant us a limited license to use, store, and display Your Content solely to provide the Service to you.
            </p>
            <p className="text-warm-600 leading-relaxed mb-4">
              You are solely responsible for Your Content and represent that you have all necessary rights to submit it.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Third-Party Integrations
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              Our Service may integrate with third-party services such as Google Calendar. Your use of these integrations is subject to the respective third party&apos;s terms of service and privacy policies. We are not responsible for the practices of these third parties.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Intellectual Property
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              The Service and its original content (excluding Your Content), features, and functionality are owned by Scribe and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express permission.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Disclaimer of Warranties
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Limitation of Liability
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SCRIBE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
            </p>
            <p className="text-warm-600 leading-relaxed mb-4">
              OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Termination
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              You may terminate your account at any time by contacting us. We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms.
            </p>
            <p className="text-warm-600 leading-relaxed mb-4">
              Upon termination, your right to use the Service will cease immediately. We may delete your data in accordance with our data retention policies.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Indemnification
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              You agree to indemnify and hold harmless Scribe and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Governing Law
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of Utah, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Changes to Terms
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              We reserve the right to modify these Terms at any time. We will provide notice of significant changes by posting the updated Terms on our website. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Severability
            </h2>
            <p className="text-warm-600 leading-relaxed mb-4">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-serif font-light text-warm-800 mb-4">
              Contact Us
            </h2>
            <p className="text-warm-600 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{" "}
              <a 
                href="mailto:hello@scribe.wedding" 
                className="text-warm-700 underline hover:text-warm-900"
              >
                hello@scribe.wedding
              </a>
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-8 bg-warm-100 border-t border-warm-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-serif tracking-widest uppercase text-warm-700 mb-2">
            Scribe
          </p>
          <p className="text-xs text-warm-500">
            © {new Date().getFullYear()} Scribe. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}