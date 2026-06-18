import { memo, useMemo, useRef, useState, useCallback } from 'react';
import { ShaderMount } from '@paper-design/shaders-react';
import {
  flutedGlassFragmentShader,
  getShaderColorFromString,
  ShaderFitOptions,
  defaultObjectSizing,
  GlassDistortionShapes,
  GlassGridShapes,
} from '@paper-design/shaders';

/**
 * Patch the stock fluted-glass fragment shader to add an x-axis mouse falloff.
 *
 * We inject:
 *   - two uniforms: u_mouse (normalized 0..1 cursor x in .x) and u_mouseRadius
 *   - mouseFalloff = 1 - smoothstep(0, radius, |uvMask.x - u_mouse.x|)
 *     -> 1 right at the cursor's x, ramping down to 0 a `radius` away.
 *   - multiply highlights / shadows / distortion (+ the distortion-driven
 *     frameFade) by mouseFalloff so all three are present only around the
 *     cursor and the rest of the image stays clear.
 *
 * Only the x distance is used, so the refracted zone is a vertical band that
 * tracks the mouse horizontally.
 */
function patchShader(src) {
  return (
    src
      // 1. declare the new uniforms
      .replace(
        'out vec4 fragColor;',
        'out vec4 fragColor;\nuniform vec2 u_mouse;\nuniform float u_mouseRadius;'
      )
      // 2. compute the falloff right after uvMask is available
      .replace(
        'vec2 uvMask = gl_FragCoord.xy / u_resolution.xy;',
        'vec2 uvMask = gl_FragCoord.xy / u_resolution.xy;\n' +
          '  float mouseFalloff = 1. - smoothstep(0., max(u_mouseRadius, .0001), abs(uvMask.x - u_mouse.x));'
      )
      // 3. apply to highlights
      .replace('highlights *= mask;', 'highlights *= mask;\n  highlights *= mouseFalloff;')
      // 4. apply to shadows
      .replace(
        'shadows = clamp(shadows, 0., 1.);',
        'shadows = clamp(shadows, 0., 1.);\n  shadows *= mouseFalloff;'
      )
      // 5. apply to distortion + its edge frameFade
      .replace(
        'distortion *= 3. * u_distortion;',
        'distortion *= 3. * u_distortion;\n  distortion *= mouseFalloff;'
      )
      .replace('frameFade *= u_distortion;', 'frameFade *= u_distortion;\n  frameFade *= mouseFalloff;')
  );
}

const patchedFragmentShader = patchShader(flutedGlassFragmentShader);

export const FlutedGlassMouse = memo(function FlutedGlassMouse({
  image = '',
  colorBack = '#00000000',
  colorShadow = '#000000',
  colorHighlight = '#ffffff',
  shadows = 0.25,
  size = 0.5,
  angle = 0,
  distortion = 0.5,
  distortionShape = 'prism',
  highlights = 0.1,
  shape = 'lines',
  shift = 0,
  blur = 0,
  edges = 0.25,
  stretch = 0,
  marginLeft = 0,
  marginRight = 0,
  marginTop = 0,
  marginBottom = 0,
  grainMixer = 0,
  grainOverlay = 0,
  fit = 'cover',
  scale = 1,
  rotation = 0,
  // how wide (0..1 of width) the refracted band around the cursor ramps over
  mouseRadius = 0.36,
  speed = 0,
  frame = 0,
  ...props
}) {
  // Start offscreen so the effect is at full strength until the mouse enters.
  const [mouseX, setMouseX] = useState(-1);
  const rafRef = useRef(0);

  const handlePointerMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setMouseX(x));
  }, []);

  const handlePointerLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setMouseX(-1);
  }, []);

  const uniforms = useMemo(
    () => ({
      u_image: image,
      u_colorBack: getShaderColorFromString(colorBack),
      u_colorShadow: getShaderColorFromString(colorShadow),
      u_colorHighlight: getShaderColorFromString(colorHighlight),
      u_shadows: shadows,
      u_size: size,
      u_angle: angle,
      u_distortion: distortion,
      u_shift: shift,
      u_blur: blur,
      u_edges: edges,
      u_stretch: stretch,
      u_distortionShape: GlassDistortionShapes[distortionShape],
      u_highlights: highlights,
      u_shape: GlassGridShapes[shape],
      u_marginLeft: marginLeft,
      u_marginRight: marginRight,
      u_marginTop: marginTop,
      u_marginBottom: marginBottom,
      u_grainMixer: grainMixer,
      u_grainOverlay: grainOverlay,
      // sizing
      u_fit: ShaderFitOptions[fit],
      u_scale: scale,
      u_rotation: rotation,
      u_offsetX: defaultObjectSizing.offsetX,
      u_offsetY: defaultObjectSizing.offsetY,
      u_originX: defaultObjectSizing.originX,
      u_originY: defaultObjectSizing.originY,
      u_worldWidth: defaultObjectSizing.worldWidth,
      u_worldHeight: defaultObjectSizing.worldHeight,
      // our additions
      u_mouse: [mouseX, 0.5],
      u_mouseRadius: mouseRadius,
    }),
    [
      image, colorBack, colorShadow, colorHighlight, shadows, size, angle, distortion,
      shift, blur, edges, stretch, distortionShape, highlights, shape, marginLeft,
      marginRight, marginTop, marginBottom, grainMixer, grainOverlay, fit, scale,
      rotation, mouseX, mouseRadius,
    ]
  );

  return (
    <ShaderMount
      {...props}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      speed={speed}
      frame={frame}
      fragmentShader={patchedFragmentShader}
      mipmaps={['u_image']}
      uniforms={uniforms}
    />
  );
});
