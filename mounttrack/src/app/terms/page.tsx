import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — MountTrack',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← MountTrack
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective date: March 17, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90 leading-7">

          <section>
            <h2 className="text-lg font-semibold mb-3">1. Agreement</h2>
            <p>
              By creating an account or using MountTrack ("Service"), you ("Shop Owner" or "you") agree to
              these Terms of Service ("Terms"). MountTrack is operated as a sole proprietorship at 800 Bill
              Jones Rd, Aynor, SC 29511 ("we," "us," or "our"). If you do not agree to these Terms, do not
              use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Description of Service</h2>
            <p>
              MountTrack is a subscription-based SaaS platform that allows taxidermy shop owners to manage
              jobs, communicate with customers via SMS and email, and accept payments. Features include a
              job stage board, customer portal, automated notifications, and a waitlist tool.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years old and have the legal authority to enter into these Terms on
              behalf of yourself or your business. By using the Service, you represent that you meet these
              requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Accounts</h2>
            <p>
              You are responsible for maintaining the security of your account credentials and for all
              activity that occurs under your account. Notify us immediately at{' '}
              <a href="mailto:mountracksupport@gmail.com" className="text-violet-400 hover:underline">
                mountracksupport@gmail.com
              </a>{' '}
              if you suspect unauthorized access. We are not liable for losses resulting from unauthorized
              use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Subscriptions and Payment</h2>
            <p>
              Access to MountTrack requires a paid monthly subscription, billed through Stripe. By
              subscribing, you authorize us to charge your payment method on a recurring basis. All fees are
              non-refundable except where required by law.
            </p>
            <p className="mt-3">
              We may change subscription pricing with at least 30 days' notice. Continued use of the Service
              after a price change constitutes acceptance of the new pricing.
            </p>
            <p className="mt-3">
              If payment fails, your account may be suspended until payment is resolved. You can cancel your
              subscription at any time through the billing portal; cancellation takes effect at the end of
              the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. SMS Messaging</h2>
            <p>
              MountTrack sends automated SMS messages to your customers on your behalf using Twilio. By
              using the SMS features of MountTrack, you agree to the following:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                You have obtained or will obtain the necessary consent from your customers to receive
                transactional SMS messages related to their taxidermy job.
              </li>
              <li>
                You will not use MountTrack to send unsolicited, deceptive, or harassing messages.
              </li>
              <li>
                You will comply with all applicable laws and regulations governing SMS communications,
                including the Telephone Consumer Protection Act (TCPA) and CTIA guidelines.
              </li>
              <li>
                Customers may opt out at any time by replying STOP. You will not attempt to circumvent
                opt-outs.
              </li>
            </ul>
            <p className="mt-3">
              Message and data rates may apply to messages sent to your customers. You are responsible for
              ensuring your customers are aware of this.
            </p>
            <p className="mt-3">
              We reserve the right to suspend SMS functionality for accounts that violate these requirements
              or generate excessive opt-out or complaint rates.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Customer Data</h2>
            <p>
              You retain ownership of all customer data you enter into MountTrack. By entering customer
              data, you represent that you have the right to share that data with us for the purpose of
              delivering the Service.
            </p>
            <p className="mt-3">
              We process customer data only as directed by you and as described in our{' '}
              <Link href="/privacy" className="text-violet-400 hover:underline">
                Privacy Policy
              </Link>
              . We do not sell customer data or use it for purposes unrelated to your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure</li>
              <li>Reverse engineer, copy, or resell the Service</li>
              <li>Upload malicious code or content</li>
              <li>Use the Service to harass, threaten, or defraud any person</li>
              <li>Violate any applicable local, state, national, or international law</li>
            </ul>
            <p className="mt-3">
              We reserve the right to terminate accounts that violate these terms without refund.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Intellectual Property</h2>
            <p>
              The MountTrack platform, including its software, design, and branding, is owned by us and
              protected by applicable intellectual property laws. These Terms do not grant you any ownership
              rights in the Service.
            </p>
            <p className="mt-3">
              You grant us a limited license to host, process, and display your shop branding (logo, brand
              color) solely to provide the Service to you and your customers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Third-Party Services</h2>
            <p>
              MountTrack integrates with third-party services including Stripe (payments), Twilio (SMS),
              Resend (email), and Supabase (database). Your use of these services through MountTrack is
              also subject to their respective terms and privacy policies. We are not responsible for the
              acts or omissions of these third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
              BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR
              THAT ANY DEFECTS WILL BE CORRECTED.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING
              OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN
              THE 3 MONTHS PRECEDING THE CLAIM. WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">13. Indemnification</h2>
            <p>
              You agree to indemnify and hold us harmless from any claims, damages, or expenses (including
              reasonable attorneys' fees) arising from your use of the Service, your violation of these
              Terms, or your violation of any third party's rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">14. Termination</h2>
            <p>
              Either party may terminate these Terms at any time. We may suspend or terminate your account
              immediately for violations of these Terms. Upon termination, your right to use the Service
              ceases and we may delete your data as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">15. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of South Carolina, without regard to its
              conflict of law provisions. Any disputes shall be resolved in the courts of Horry County,
              South Carolina.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">16. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes by email
              or by a notice within the Service. Continued use after changes take effect constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">17. Contact</h2>
            <p>
              Questions about these Terms? Contact us:
              <br />
              <strong>MountTrack</strong>
              <br />
              800 Bill Jones Rd, Aynor, SC 29511
              <br />
              <a href="mailto:mountracksupport@gmail.com" className="text-violet-400 hover:underline">
                mountracksupport@gmail.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border flex gap-6 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
