export {};

// Teller Connect is loaded via an external <script> (cdn.teller.io). This is
// the single canonical type for the global it attaches to `window`.
declare global {
  interface Window {
    TellerConnect?: {
      setup: (opts: {
        applicationId: string;
        environment?: string;
        products?: string[];
        onSuccess: (enrollment: {
          accessToken: string;
          enrollment: { id: string; institution: { name: string } };
        }) => void;
        onExit?: () => void;
        onFailure?: (e: unknown) => void;
      }) => { open: () => void };
    };
  }
}
