export {};

declare global {
  interface Window {
    TellerConnect?: {
      setup: (opts: {
        applicationId: string;
        environment?: string;
        products?: string[];
        onSuccess: (enrollment: { accessToken: string; enrollment: { id: string; institution: { name: string } } }) => void;
        onExit?: () => void;
        onFailure?: (e: unknown) => void;
      }) => { open: () => void };
    };
  }
}
