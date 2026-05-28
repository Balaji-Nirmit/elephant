'use client';
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-12 border-b border-border">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold text-foreground mb-4"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Last updated: March 2026
          </motion.p>
        </div>
      </div>

      {/* Content */}
      <div className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-4xl prose prose-invert dark:prose-invert">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-8 text-muted-foreground"
          >
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
              <p>
                Ploopus ("we" or "us" or "our") operates the Ploopus application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">2. Local-First Data Philosophy</h2>
              <p>
                Ploopus is built on a local-first principle. Your data is stored locally on your device. We do not collect, store, or have access to your notes, documents, or personal information unless you explicitly choose to sync or backup to external services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">3. Information We Collect</h2>
              <p>
                When you use Ploopus, we may collect:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Account information (email, profile name)</li>
                <li>Usage analytics (features used, performance metrics)</li>
                <li>Device information (OS, browser version)</li>
                <li>Error logs (to improve stability)</li>
              </ul>
              <p>
                We do NOT collect the content of your notes or documents.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">4. How We Use Information</h2>
              <p>
                The information we collect is used to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide and maintain the service</li>
                <li>Improve user experience and performance</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Detect and prevent technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">5. Data Security</h2>
              <p>
                The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">6. Third-Party Services</h2>
              <p>
                If you choose to enable sync or backup features, your data may be transmitted to third-party services (Google Drive, Dropbox, etc.). We recommend reviewing their privacy policies. We are not responsible for their practices.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">7. User Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of non-essential data collection</li>
                <li>Export your data at any time</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">8. Cookies</h2>
              <p>
                Ploopus uses local storage and minimal cookies only for essential functionality like authentication and preferences. We do not use tracking cookies or third-party analytics for profiling.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">9. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at cursorbits@gmail.com
              </p>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
