import { PublicLayout } from "@/components/layout/PublicLayout";

export default function TermsOfService() {
  return (
    <PublicLayout>
      <div className="container mx-auto px-4 md:px-6 py-16 max-w-3xl">
        <article className="prose prose-slate max-w-none">
          <h1 className="text-4xl font-display font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last Updated: October 2023</p>
          
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8 text-sm">
            <strong>Important Notice:</strong> This is a demonstration application. No real financial data is connected, and no real money is involved. The service is provided "as-is" for demonstration purposes only.
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using TextBank, you agree to be bound by these Terms of Service.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Service Description</h2>
          <p>
            TextBank provides an SMS-based interface to view mock bank balances and recent transactions. It is exclusively a read-only data presentation layer.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate registration information.</li>
            <li>Maintain control of the mobile device registered with the service.</li>
            <li>Notify us immediately if your device is lost or stolen by texting STOP from another registered device or via our web portal.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Limitations of Liability</h2>
          <p>
            Because this is a read-only service, we bear no liability for any unauthorized transactions that occur at your financial institution. We simply display data provided by the integration layer. We are not responsible for delayed or misdelivered SMS messages caused by carrier network issues.
          </p>
        </article>
      </div>
    </PublicLayout>
  );
}
