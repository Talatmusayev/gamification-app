---
trigger: always_on
---

# Design & Visual Engineering References

When designing, building, or upgrading UI, shaders, 3D scenes, or brand/hero visuals in this project (`dew-and-bloom`), always reference and draw inspiration from these four GitHub repositories:

1. **react-three-fiber** — `https://github.com/pmndrs/react-three-fiber`
   - Declarative Three.js renderer for React (`@react-three/fiber` / `@react-three/fiber/native` with `expo-gl` on React Native, and standard WebGL on web).
2. **liquid-glass-js** — `https://github.com/dashersw/liquid-glass-js` (and related implementations like `https://github.com/Amir-Abushanab/liquid-glass-js` / `https://github.com/shuding/liquid-glass`)
   - Apple-inspired Liquid Glass refraction, multi-layer glass, specular highlights, and chromatic dispersion effects (adaptable via WebGL/SVG on web and GLSL/Skia/blur layers on native).
3. **shadergradient** — `https://github.com/ruucm/shadergradient`
   - Animated 3D WebGL mesh/shader gradients built on React Three Fiber (`@shadergradient/react`).
4. **liquid-logo** — `https://github.com/paper-design/liquid-logo`
   - WebGL fragment-shader liquid-metal logo animation and edge-field effects (powered by Paper Shaders; note PolyForm Shield license on the `liquid-logo` app repo vs. MIT on `@paper-design/shaders-react`).
