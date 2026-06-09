import { getGalleryImages, getBeforeAfterPair } from "@/lib/cms/gallery";
import GallerySectionClient from "./gallery-section-client";

export default async function GallerySection() {
  const [images, pair] = await Promise.all([
    getGalleryImages(),
    getBeforeAfterPair(),
  ]);
  return <GallerySectionClient images={images} pair={pair} />;
}
