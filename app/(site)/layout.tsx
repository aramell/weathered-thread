import type { ReactNode } from "react";
import NavHeader from "@/components/nav-header";
import NavScrollShell from "@/components/nav-scroll-shell";

/**
 * app/(site)/layout.tsx — wraps every route under the (site) group with the
 * persistent nav. Home's own <main> markup is untouched; this only adds the
 * nav ahead of `children`.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <NavScrollShell>
        <NavHeader />
      </NavScrollShell>
      {children}
    </>
  );
}
