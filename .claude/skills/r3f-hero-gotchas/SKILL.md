---
name: r3f-hero-gotchas
description: Use when editing any file under src/components/hero/ or any React Three Fiber, three.js, drei, or Theatre.js code in this repo. Captures the Windows ANGLE TDR, react-hooks/purity, useFrame allocation, dpr cap, Suspense, and Theatre Studio bundle landmines this project has already hit.
---

# R3F / Theatre.js Hero Gotchas

The hero stack (`src/components/hero/`) has hit several non-obvious issues. Read these before editing any file in that directory. Each entry: **symptom → root cause → fix → source**.

## 1. No `Environment` from `@react-three/drei`

**Symptom:** On Windows + integrated GPUs (ANGLE backend), loading an HDR/EXR environment map triggers a TDR (Timeout Detection & Recovery) reset, the WebGL context is lost, the hero goes black, and `webgl context lost` appears in console.

**Root cause:** `<Environment>` decodes a multi-MB HDR cubemap on the GPU on first paint. Older Windows drivers running through ANGLE cannot complete the decode within the TDR budget.

**Fix:** Light the scene manually with `<ambientLight>` + `<directionalLight>` (see `src/components/hero/hero-canvas.tsx`). Tune `meshStandardMaterial` `metalness`/`roughness`/`emissive` so reflective surfaces still read as chrome without an env map.

**Source:** Commit `c1a7d5b`. Do not reintroduce `<Environment>`, `useEnvironment`, or any HDR loader without a Windows ANGLE test pass.

## 2. Randomized / seeded data lives at module scope

**Symptom:** `react-hooks/purity` ESLint error, or particles re-randomize on every render and the scene jitters.

**Root cause:** Function-component bodies must be pure. Calling `Math.random()` inside a component breaks React's purity contract and produces unstable output across renders.

**Fix:** Declare seed/random data at module scope (see `src/components/hero/chrome-particles.tsx`, the `PARTICLES` constant). Components read it; they don't generate it.

**Source:** Commit `6be90eb`. Any new randomized geometry, positions, or noise tables for the hero should follow the same pattern.

## 3. `useFrame` mutates — it must never allocate

**Symptom:** Frame rate degrades over time; periodic GC pauses.

**Root cause:** Allocating `Vector3`/`Matrix4`/`Object3D` per frame (60+/sec × 800 particles = thousands of allocations/sec) thrashes the heap.

**Fix:** Pre-allocate a single `dummy = new THREE.Object3D()` via `useMemo`, then mutate `dummy.position` / `dummy.scale`, call `dummy.updateMatrix()`, and `mesh.setMatrixAt(i, dummy.matrix)`. End the frame with `mesh.instanceMatrix.needsUpdate = true`. See `chrome-particles.tsx` for the pattern.

## 4. Cap `dpr` on `<Canvas>`

**Symptom:** Hero is buttery on a laptop but tanks fps on a 4K monitor or high-DPI phone.

**Root cause:** Default `dpr` matches device pixel ratio. On 4K/Retina that means 4× the fragment work, and the instanced particles + per-frame matrix updates don't have the headroom.

**Fix:** `<Canvas dpr={[1, 1.75]} ...>` (current value in `hero-canvas.tsx`). Lower the upper bound if you add post-processing or more particles.

## 5. Always render a `<Suspense>` fallback over the Canvas

**Symptom:** SSR mismatch, blank hero during hydration, or a hard blank screen on WebGL context loss.

**Root cause:** R3F suspends during asset loading. Without a fallback, the hero unmounts to nothing — and there's no graceful recovery surface if the GPU drops the context.

**Fix:** Wrap `<Canvas>` in `<Suspense fallback={<StaticFallback />}>` where `StaticFallback` is a CSS-only gradient that visually matches the scene (see `hero-canvas.tsx`).

## 6. `@theatre/studio` is a DEV-ONLY import

**Symptom:** Production bundle gains hundreds of KB; Theatre's editor UI shows on the live site.

**Root cause:** `@theatre/studio` is the in-browser editor. It has no business in production. It sits in `dependencies` because Theatre's setup recommends conditional import, not because it's a runtime dependency.

**Fix:** Never `import "@theatre/studio"` at the top of a module that ships to production. Gate it:
```ts
if (process.env.NODE_ENV !== "production") {
  import("@theatre/studio").then((studio) => studio.default.initialize());
}
```
`hero-timeline.ts` currently only imports `@theatre/core` (the runtime), which is correct.

## Quick reference

| Don't | Do |
|-------|-----|
| `import { Environment } from "@react-three/drei"` | Manual `directionalLight` + tuned material |
| `const data = createRandomStuff()` inside a component | Hoist to module scope |
| `new THREE.Vector3()` inside `useFrame` | Pre-allocate via `useMemo` and mutate |
| `<Canvas>` without `dpr` cap | `dpr={[1, 1.75]}` |
| `<Canvas>` without Suspense parent | Wrap in `<Suspense fallback={...}>` |
| `import "@theatre/studio"` unconditionally | Dev-only dynamic import |

## After you've touched the hero

The `chrome-devtools` MCP is wired into this repo. After any meaningful hero edit:

1. Reload `/` and watch console — no `WebGL: CONTEXT_LOST_WEBGL`, no purity warnings, no Theatre studio noise
2. Take a screenshot, confirm the scene composes as expected
3. Throttle to 4× CPU and confirm fps stays above ~30
4. If you added a drei component, search its source under `node_modules/@react-three/drei/` and confirm it doesn't pull HDR loaders
