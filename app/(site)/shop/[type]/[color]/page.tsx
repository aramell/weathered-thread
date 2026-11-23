import { redirect } from "next/navigation";

/**
 * Designs come first: the visitor picks a design on Shop or a Collection, then chooses style,
 * color and size on that design's page. Garment-first pages no longer exist, so old links
 * land on the design grid.
 */
export default function GarmentFirstRedirect() {
  redirect("/shop");
}
