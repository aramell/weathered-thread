import { NextResponse } from "next/server";
import { getListing } from "@/lib/catalog";
import { handoffPath, listingUrlWithSelection, parseSelection } from "@/lib/checkout";

/**
 * The `shop.` forward (Epic 4 Story 4.2): resolves the design's Etsy listing url from the
 * synced catalog on the server, so it is never built or rewritten client-side and never in
 * site markup (NFR8). The visitor's style/color/size ride along as Etsy's `variationN`
 * parameters so they needn't pick again there (bare listing url if the pick doesn't resolve).
 * A design we can't forward goes back to the
 * Handoff with the retry copy instead of failing silently.
 */
export function GET(request: Request, ctx: RouteContext<"/go/[slug]">) {
  return ctx.params.then(({ slug }) => {
    const { searchParams } = new URL(request.url);
    const selection = parseSelection(Object.fromEntries(searchParams));

    const listing = getListing(slug);
    if (listing && listing.state === "active") {
      const target = selection ? listingUrlWithSelection(listing.url, listing.variations, selection) : listing.url;
      return NextResponse.redirect(target, { status: 307, headers: { "cache-control": "no-store" } });
    }

    const back = selection ? handoffPath(slug, selection, true) : "/shop";
    return NextResponse.redirect(new URL(back, request.url), { status: 307, headers: { "cache-control": "no-store" } });
  });
}
