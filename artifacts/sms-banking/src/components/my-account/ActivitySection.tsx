import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function ActivitySection({ children }: Props) {
  return <section className="space-y-4">{children}</section>;
}
