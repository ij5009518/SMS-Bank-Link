import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", dialCode: "1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dialCode: "1", flag: "🇨🇦" },
  { code: "GB", name: "United Kingdom", dialCode: "44", flag: "🇬🇧" },
  { code: "AU", name: "Australia", dialCode: "61", flag: "🇦🇺" },
  { code: "DE", name: "Germany", dialCode: "49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "33", flag: "🇫🇷" },
  { code: "IN", name: "India", dialCode: "91", flag: "🇮🇳" },
  { code: "JP", name: "Japan", dialCode: "81", flag: "🇯🇵" },
  { code: "CN", name: "China", dialCode: "86", flag: "🇨🇳" },
  { code: "BR", name: "Brazil", dialCode: "55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", dialCode: "52", flag: "🇲🇽" },
  { code: "NG", name: "Nigeria", dialCode: "234", flag: "🇳🇬" },
  { code: "ZA", name: "South Africa", dialCode: "27", flag: "🇿🇦" },
  { code: "KE", name: "Kenya", dialCode: "254", flag: "🇰🇪" },
  { code: "GH", name: "Ghana", dialCode: "233", flag: "🇬🇭" },
  { code: "PH", name: "Philippines", dialCode: "63", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", dialCode: "62", flag: "🇮🇩" },
  { code: "PK", name: "Pakistan", dialCode: "92", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", dialCode: "880", flag: "🇧🇩" },
  { code: "NG", name: "Nigeria", dialCode: "234", flag: "🇳🇬" },
  { code: "EG", name: "Egypt", dialCode: "20", flag: "🇪🇬" },
  { code: "AR", name: "Argentina", dialCode: "54", flag: "🇦🇷" },
  { code: "CO", name: "Colombia", dialCode: "57", flag: "🇨🇴" },
  { code: "CL", name: "Chile", dialCode: "56", flag: "🇨🇱" },
  { code: "PE", name: "Peru", dialCode: "51", flag: "🇵🇪" },
  { code: "VE", name: "Venezuela", dialCode: "58", flag: "🇻🇪" },
  { code: "ES", name: "Spain", dialCode: "34", flag: "🇪🇸" },
  { code: "IT", name: "Italy", dialCode: "39", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", dialCode: "31", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", dialCode: "46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dialCode: "47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", dialCode: "45", flag: "🇩🇰" },
  { code: "FI", name: "Finland", dialCode: "358", flag: "🇫🇮" },
  { code: "PL", name: "Poland", dialCode: "48", flag: "🇵🇱" },
  { code: "UA", name: "Ukraine", dialCode: "380", flag: "🇺🇦" },
  { code: "RU", name: "Russia", dialCode: "7", flag: "🇷🇺" },
  { code: "TR", name: "Turkey", dialCode: "90", flag: "🇹🇷" },
  { code: "SA", name: "Saudi Arabia", dialCode: "966", flag: "🇸🇦" },
  { code: "AE", name: "UAE", dialCode: "971", flag: "🇦🇪" },
  { code: "IL", name: "Israel", dialCode: "972", flag: "🇮🇱" },
  { code: "SG", name: "Singapore", dialCode: "65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", dialCode: "60", flag: "🇲🇾" },
  { code: "TH", name: "Thailand", dialCode: "66", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", dialCode: "84", flag: "🇻🇳" },
  { code: "KR", name: "South Korea", dialCode: "82", flag: "🇰🇷" },
  { code: "NZ", name: "New Zealand", dialCode: "64", flag: "🇳🇿" },
  { code: "IE", name: "Ireland", dialCode: "353", flag: "🇮🇪" },
  { code: "PT", name: "Portugal", dialCode: "351", flag: "🇵🇹" },
  { code: "CH", name: "Switzerland", dialCode: "41", flag: "🇨🇭" },
  { code: "AT", name: "Austria", dialCode: "43", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", dialCode: "32", flag: "🇧🇪" },
  { code: "GR", name: "Greece", dialCode: "30", flag: "🇬🇷" },
  { code: "CZ", name: "Czech Republic", dialCode: "420", flag: "🇨🇿" },
  { code: "RO", name: "Romania", dialCode: "40", flag: "🇷🇴" },
  { code: "HU", name: "Hungary", dialCode: "36", flag: "🇭🇺" },
  { code: "JM", name: "Jamaica", dialCode: "1876", flag: "🇯🇲" },
  { code: "TT", name: "Trinidad & Tobago", dialCode: "1868", flag: "🇹🇹" },
  { code: "BB", name: "Barbados", dialCode: "1246", flag: "🇧🇧" },
  { code: "GY", name: "Guyana", dialCode: "592", flag: "🇬🇾" },
];

const DEFAULT_COUNTRY = COUNTRIES[0];

function parseValue(value: string): { dialCode: string; local: string } {
  if (!value) return { dialCode: DEFAULT_COUNTRY.dialCode, local: "" };
  const digits = value.replace(/\D/g, "");
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dialCode)) {
      return { dialCode: c.dialCode, local: digits.slice(c.dialCode.length) };
    }
  }
  return { dialCode: DEFAULT_COUNTRY.dialCode, local: digits };
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "Phone number",
  className,
  inputClassName,
  disabled,
  onKeyDown,
}: PhoneInputProps) {
  const parsed = parseValue(value);
  const [dialCode, setDialCode] = useState(parsed.dialCode);
  const [localNumber, setLocalNumber] = useState(parsed.local);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.dialCode === dialCode) ?? DEFAULT_COUNTRY;

  useEffect(() => {
    const p = parseValue(value);
    if (p.dialCode !== dialCode || p.local !== localNumber) {
      setDialCode(p.dialCode);
      setLocalNumber(p.local);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const emit = (dc: string, local: string) => {
    const digits = local.replace(/\D/g, "");
    onChange(`+${dc}${digits}`);
  };

  const handleCountrySelect = (country: Country) => {
    setDialCode(country.dialCode);
    setOpen(false); setSearch("");
    emit(country.dialCode, localNumber);
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s\-().]/g, "");
    setLocalNumber(raw);
    emit(dialCode, raw);
  };

  const filtered = search
    ? COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const uniqueFiltered = filtered.filter((c, i, arr) => arr.findIndex((x) => x.code === c.code) === i);

  return (
    <div className={cn("flex h-10 rounded-xl border border-slate-200 bg-white overflow-visible focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all", className)}>
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setSearch(""); }}
          disabled={disabled}
          className="flex items-center gap-1 px-3 h-full border-r border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-l-xl text-sm font-medium text-slate-700 transition-colors select-none min-w-[72px]"
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <span className="text-xs text-slate-500">+{dialCode}</span>
          <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute z-[9999] top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country…"
                className="w-full h-8 px-2.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400"
              />
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {uniqueFiltered.length === 0 && (
                <div className="px-3 py-4 text-xs text-slate-400 text-center">No countries found</div>
              )}
              {uniqueFiltered.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors",
                    country.dialCode === dialCode && "bg-blue-50 text-blue-700"
                  )}
                >
                  <span className="text-base leading-none w-6 shrink-0">{country.flag}</span>
                  <span className="flex-1 text-xs font-medium text-slate-800 truncate">{country.name}</span>
                  <span className="text-xs text-slate-400 font-mono shrink-0">+{country.dialCode}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        type="tel"
        value={localNumber}
        onChange={handleLocalChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex-1 min-w-0 px-3 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none rounded-r-xl",
          inputClassName
        )}
      />
    </div>
  );
}
