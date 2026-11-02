import type { Metadata } from "next";
import BagView from "@/components/bag-view";

export const metadata: Metadata = {
  title: "Your Bag — Weathered Thread",
  robots: { index: false },
};

/**
 * The bag. The page itself is static: the bag lives in the visitor's browser, so `BagView`
 * reads it there and asks the server to price it.
 */
export default function BagPage() {
  return (
    <main className="flex flex-col gap-story-gap">
      <BagView />
    </main>
  );
}
