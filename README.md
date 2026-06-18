# Fluted Glass — mouse-follow refraction

A minimal Vite + React page built around Paper Design's
[`fluted-glass`](https://shaders.paper.design/fluted-glass) shader, with a
custom tweak: the glass **refraction only happens in a vertical band that
follows the cursor's x position**. The rest of the image stays clean.

## Requirements

- [Node.js](https://nodejs.org/) 18+ (ships with `npm`)

## Run it

```bash
npm install      # first time only
npm run dev      # start the dev server
```

Then open the URL it prints (default **http://localhost:5173**) and move your
mouse left/right.

## Other commands

```bash
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## How it works

- **`src/App.jsx`** — the page. Mounts the glass full-screen over an image and
  sets the shader params. The refracted image is a remote
  [picsum.photos](https://picsum.photos) URL (`IMAGE` constant) — swap it for
  any CORS-friendly image, or the `image` prop.
- **`src/FlutedGlassMouse.jsx`** — the custom component. It reuses the stock
  shader from `@paper-design/shaders` and patches the GLSL at load time to add
  two uniforms (`u_mouse`, `u_mouseRadius`) and an x-axis falloff:

  ```glsl
  float mouseFalloff = 1. - smoothstep(0., u_mouseRadius, abs(uvMask.x - u_mouse.x));
  ```

  `highlights`, `shadows`, and `distortion` are all multiplied by this, so they
  ramp to full strength at the cursor and to zero a `mouseRadius` away. Only the
  x distance is used. The cursor x is tracked with a `pointermove` handler
  (throttled via `requestAnimationFrame`) and fed in as the `u_mouse` uniform.

### Knobs worth knowing

- `mouseRadius` prop (`0..1` of width, default `0.36`) — width of the refracted
  band around the cursor.
- Standard fluted-glass props are passed straight through: `shape`,
  `distortionShape`, `size`, `distortion`, `shadows`, `highlights`, `edges`,
  etc. See the [Paper Design docs](https://shaders.paper.design/fluted-glass).
