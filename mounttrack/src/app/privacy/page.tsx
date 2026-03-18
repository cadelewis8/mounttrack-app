import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — MountTrack',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← MountTrack
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective date: March 17, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90 leading-7">

          <section>
            <h2 className="text-lg font-semibold mb-3">1. Who We Are</h2>
            <p>
              MountTrack ("we," "us," or "our") is a software platform for taxidermy shop owners, operated
              as a sole proprietorship at 800 Bill Jones Rd, Aynor, SC 29511. You can reach us at{' '}
              <a href="mailto:mountracksupport@gmail.com" className="text-violet-400 hover:underline">
                mountracksupport@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Who This Policy Covers</h2>
            <p>This Privacy Policy applies to two groups of people:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Shop Owners</strong> — taxidermy businesses that subscribe to MountTrack to manage
                their jobs and customers.
              </li>
              <li>
                <strong>Customers</strong> — end customers of those shops whose information is entered into
                MountTrack by the shop owner.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Information We Collect</h2>

            <h3 className="font-medium mt-4 mb-2">From Shop Owners</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name and email address (used to create your account)</li>
              <li>Shop name, logo, and brand settings</li>
              <li>Payment and billing information (processed by Stripe — we never store card numbers)</li>
              <li>Usage data such as jobs created, stages configured, and features used</li>
            </ul>

            <h3 className="font-medium mt-4 mb-2">From Customers (entered by shop owners)</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full name</li>
              <li>Mobile phone number</li>
              <li>Email address</li>
              <li>Job details (animal type, mount style, quoted price, estimated completion date)</li>
              <li>Progress photos uploaded by the shop</li>
              <li>Payment records for deposits and balances</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. SMS Messaging</h2>
            <p>
              MountTrack sends automated SMS text messages to customers on behalf of their taxidermy shop.
              These messages are sent using Twilio and may include:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Job stage updates (e.g. "Your mount has moved to Finishing")</li>
              <li>Payment requests when a mount is ready for pickup</li>
              <li>Waitlist confirmations when a customer is added to a shop's waitlist</li>
            </ul>

            <p className="mt-3">
              <strong>Message frequency:</strong> Message frequency varies depending on job activity.
              Customers typically receive 1–6 messages per job across its lifecycle.
            </p>
            <p className="mt-3">
              <strong>Message and data rates may apply.</strong> Standard message and data rates from your
              mobile carrier may apply to SMS messages received.
            </p>
            <p className="mt-3">
              <strong>Opt-out:</strong> You can stop receiving SMS messages at any time by replying{' '}
              <strong>STOP</strong> to any message. After opting out, you will receive a one-time
              confirmation message and no further SMS messages will be sent. To re-subscribe, reply{' '}
              <strong>START</strong>.
            </p>
            <p className="mt-3">
              <strong>Help:</strong> For assistance, reply <strong>HELP</strong> to any message or contact
              us at{' '}
              <a href="mailto:mountracksupport@gmail.com" className="text-violet-400 hover:underline">
                mountracksupport@gmail.com
              </a>
              .
            </p>
            <p className="mt-3">
              Phone numbers collected for SMS communication are not shared with third parties for marketing
              purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To operate and deliver the MountTrack platform to shop owners</li>
              <li>To send automated job notifications and payment requests to customers via SMS and email</li>
              <li>To process payments through Stripe</li>
              <li>To provide customer support</li>
              <li>To improve platform features and reliability</li>
            </ul>
            <p className="mt-3">
              We do not sell personal information. We do not use customer phone numbers or emails for
              marketing unrelated to the job that generated them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. How We Share Information</h2>
            <p>We share data only with the following service providers as necessary to operate MountTrack:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Supabase</strong> — database and authentication hosting
              </li>
              <li>
                <strong>Twilio</strong> — SMS delivery
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery
              </li>
              <li>
                <strong>Stripe</strong> — payment processing
              </li>
              <li>
                <strong>Vercel</strong> — application hosting
              </li>
            </ul>
            <p className="mt-3">
              We may also disclose information if required by law, court order, or to protect the rights and
              safety of our users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Data Retention</h2>
            <p>
              Shop owner account data is retained for the duration of the subscription and for up to 90 days
              after cancellation, after which it is deleted. Customer job data is retained as long as the
              associated shop account is active.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Security</h2>
            <p>
              We use industry-standard security practices including encrypted connections (HTTPS), row-level
              security on all database tables, and access controls that prevent shop owners from accessing
              each other's data. We do not store plain-text passwords or full payment card numbers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Children's Privacy</h2>
            <p>
              MountTrack is not directed at children under 13. We do not knowingly collect personal
              information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data by contacting us
              at{' '}
              <a href="mailto:mountracksupport@gmail.com" className="text-violet-400 hover:underline">
                mountracksupport@gmail.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the effective
              date at the top of this page. Continued use of MountTrack after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Contact</h2>
            <p>
              Questions about this Privacy Policy? Contact us:
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
