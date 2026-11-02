import type { Metadata } from "next";
import ClearBag from "@/components/clear-bag";
import ButtonSecondary from "@/components/button-secondary";

export const metadata: Metadata = {
  title: "Thank you — Weathered Thread",
  robots: { index: false },
};

/**
 * Where Square sends the visitor after paying. It is a courtesy page, not proof of payment:
 * anyone can open this url, so it claims nothing about an order and the real record is the
 * order webhook. It only empties the bag.
 */
export default function ThankYouPage() {
  return (
    <main className="flex flex-col gap-story-gap">
      <ClearBag />
      <section className="mx-auto w-full max-w-md bg-sailcloth px-gutter-mobile py-story-gap text-center md:px-gutter-desktop">
        <h1 className="mb-4 font-display text-headline">Thank you.</h1>
        <p className="mb-6 font-body text-body">
          Square will email your receipt. Each piece is made to order, so we&apos;ll begin stitching yours soon.
        </p>
        <ButtonSecondary href="/shop">Keep browsing</ButtonSecondary>
      </section>
    </main>
  );
}
