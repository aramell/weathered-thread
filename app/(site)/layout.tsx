import type { ReactNode } from "react";
import Footer from "@/components/footer";
import NavHeader from "@/components/nav-header";
import NavScrollShell from "@/components/nav-scroll-shell";

/**
 * app/(site)/layout.tsx — wraps every route under the (site) group with the
 * persistent nav and footer. Page `<main>` markup is untouched; this only
 * adds the nav ahead of `children` and the footer after it.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <NavScrollShell>
        <NavHeader />
      </NavScrollShell>
      {children}
      <Footer />
    </>
  );
}
