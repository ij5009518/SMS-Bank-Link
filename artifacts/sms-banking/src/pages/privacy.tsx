import { PublicLayout } from "@/components/layout/PublicLayout";

export default function PrivacyPolicy() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
        <article className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-display font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: October 2023</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            TextBank ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our read-only SMS banking bridge service.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Read-Only Architecture</h2>
          <p>
            Our core promise to you is built into our architecture. We only request <strong>read-only access</strong> to your financial institution. Our system physically cannot initiate transfers, make payments, or move money in any way.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Collection</h2>
          <p>We collect the following information:</p>
          <ul>
            <li>Your mobile phone number for authentication and SMS delivery.</li>
            <li>Mock financial data explicitly authorized by you during the demo linking process.</li>
            <li>SMS log history to provide the service and ensure reliable delivery.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. SMS Communications</h2>
          <p>
            By registering, you explicitly consent to receive SMS messages from us containing your requested financial data. Standard message and data rates may apply. You can opt-out at any time by replying <strong>STOP</strong>.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Security</h2>
          <p>
            We implement institutional-grade security measures. We never display or transmit your full account numbers via SMS—only the last 4 digits are ever used. Your data is encrypted at rest and in transit.
          </p>
        </article>
      </div>
    </PublicLayout>
  );
}
