export function TextBanksLogo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="36" height="36" rx="9" fill="#1C3FAA" />
      <rect x="1" y="1" width="34" height="34" rx="8" fill="url(#tb-grad)" />
      <path
        d="M7 12.5C7 10.567 8.567 9 10.5 9H25.5C27.433 9 29 10.567 29 12.5V20.5C29 22.433 27.433 24 25.5 24H21L18 27.5L15 24H10.5C8.567 24 7 22.433 7 20.5V12.5Z"
        fill="white"
        fillOpacity="0.18"
      />
      <path
        d="M7 12.5C7 10.567 8.567 9 10.5 9H25.5C27.433 9 29 10.567 29 12.5V20.5C29 22.433 27.433 24 25.5 24H21L18 27.5L15 24H10.5C8.567 24 7 22.433 7 20.5V12.5Z"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="1.25"
      />
      <rect x="11" y="18" width="3" height="3.5" rx="1" fill="white" />
      <rect x="16" y="15" width="3" height="6.5" rx="1" fill="white" />
      <rect x="21" y="12" width="3" height="9.5" rx="1" fill="white" />
      <defs>
        <linearGradient id="tb-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#1C3FAA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
