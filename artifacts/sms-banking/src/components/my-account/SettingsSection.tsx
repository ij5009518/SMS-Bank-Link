import type { ReactNode } from "react";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";

const cardClass = "bg-white border border-[#E5E0D8] rounded-2xl";

type Props = {
  children: ReactNode;
  onOpenReportBug: () => void;
};

export function SettingsSection({ children, onOpenReportBug }: Props) {
  return (
    <section className="space-y-4">
      {children}
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-[#EDE8E0]">
          <h3 className="text-sm font-bold text-[#0D0E12]">Help &amp; Support</h3>
          <p className="text-xs text-[#7C7C8A] mt-0.5">Need help or found an issue?</p>
        </div>
        <div className="p-6">
          <Button variant="outline" className="w-full rounded-xl" onClick={onOpenReportBug}>
            <Bug className="w-4 h-4 mr-2 text-red-500" />
            Report a bug
          </Button>
        </div>
      </div>
    </section>
  );
}
