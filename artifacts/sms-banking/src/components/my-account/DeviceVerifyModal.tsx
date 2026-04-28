import { AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  deviceFirstName: string;
  deviceEmailMasked: string | null;
  deviceCode: string;
  setDeviceCode: (v: string) => void;
  deviceError: string | null;
  deviceLoading: boolean;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
};

export function DeviceVerifyModal(props: Props) {
  const { deviceFirstName, deviceEmailMasked, deviceCode, setDeviceCode, deviceError, deviceLoading, onVerify, onResend, onBack } = props;
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5 text-amber-700" /></div>
        <p className="text-xs text-amber-700">Hi {deviceFirstName} — verify this browser to continue. {deviceEmailMasked ?? ""}</p>
      </div>
      <Input value={deviceCode} onChange={(e) => setDeviceCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="h-11 rounded-xl text-center" />
      {deviceError && <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5"><AlertCircle className="w-4 h-4 shrink-0" />{deviceError}</div>}
      <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl h-10" onClick={onVerify} disabled={deviceLoading || deviceCode.length !== 6}>{deviceLoading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Verifying…</> : "Verify & Sign In"}</Button>
      <div className="flex items-center justify-between text-xs"><button onClick={onResend} disabled={deviceLoading} className="text-blue-600">Resend code</button><button onClick={onBack}>Back to sign in</button></div>
    </div>
  );
}
