import {
  galleryGrid as staticGrid,
  beforeAfterPair as staticPair,
  type BeforeAfterPair,
} from "@/data/gallery";

export type CmsGalleryImage = { src: string; alt: string };

export async function getGalleryImages(): Promise<CmsGalleryImage[]> {
  return staticGrid;
}

export async function getBeforeAfterPair(): Promise<BeforeAfterPair> {
  return staticPair;
}
