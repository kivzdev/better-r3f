import * as THREE from 'three'

/**
 * One material for every formation: a lit, flat-shaded standard material whose shape is chosen in the vertex shader. The
 * geometry is a subdivided cube; the shader blends each vertex between that cube, an octahedron (a gem), a sphere and a
 * flat tile, so a particle can turn from one into another in the middle of a move. `flat` blends the lighting out, for
 * the plain coloured squares of the fluid.
 */
export interface Morph {
  shape: THREE.Vector4
  flat: { value: number }
}

export function morphMaterial(): THREE.MeshStandardMaterial & { morph: Morph } {
  const material = new THREE.MeshStandardMaterial({
    flatShading: true,
    roughness: 0.6,
    metalness: 0,
    toneMapped: false,
  })
  const morph: Morph = { shape: new THREE.Vector4(1, 0, 0, 0), flat: { value: 0 } }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uShape = { value: morph.shape }
    shader.uniforms.uFlat = morph.flat
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        uniform vec4 uShape;
        vec3 shapeOf(vec3 p) {
          vec3 dir = normalize(p);
          vec3 gem = dir / (abs(dir.x) + abs(dir.y) + abs(dir.z)) * 0.62;
          vec3 tile = vec3(p.xy, p.z * 0.02);
          return p * uShape.x + gem * uShape.y + dir * 0.5 * uShape.z + tile * uShape.w;
        }`,
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = shapeOf(vec3(position));')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFlat;')
      .replace(
        '#include <opaque_fragment>',
        'outgoingLight = mix(outgoingLight, diffuseColor.rgb, uFlat);\n#include <opaque_fragment>',
      )
  }
  material.customProgramCacheKey = () => 'better-r3f-morph'
  return Object.assign(material, { morph })
}

/** the shared geometry: a cube cut into a few faces a side, so the sphere and the gem come out round enough */
export function morphGeometry(segments: number) {
  return new THREE.BoxGeometry(1, 1, 1, segments, segments, segments)
}
