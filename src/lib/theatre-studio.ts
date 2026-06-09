"use client";

// @theatre/core must be imported before @theatre/studio is initialized.
import "@theatre/core";
import type studioType from "@theatre/studio";

let studio: typeof studioType | undefined;

if (process.env.NODE_ENV === "development") {
  void import("@theatre/studio").then((mod) => {
    studio = mod.default;
    studio?.initialize();
  });
}

export function getStudio() {
  return studio;
}
