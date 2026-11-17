import{j as e,r as i}from"./index-mQOZ9rCY.js";import{aa as t,C as s}from"./Canvas-DpR0H_vE.js";import{u}from"./hooks-DuE23wJx.js";import"./index-BKIKQNXN.js";const m=`
uniform float uTime;
varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 transformed = position;
  transformed.z += sin((position.x + uTime) * 4.0) * 0.1;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`,v=`
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  vec3 rainbow = 0.5 + 0.5 * cos(uTime + vUv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(mix(rainbow, uColor, 0.6), 1.0);
}
`;function l(){const o=i.useRef(null),[a,r]=i.useState(!1);return u(({clock:n})=>{o.current.uniforms.uTime.value=n.elapsedTime}),e.jsxs("mesh",{onPointerOver:()=>r(!0),onPointerOut:()=>r(!1),children:[e.jsx("planeGeometry",{args:[2,2,64,64]}),e.jsx("shaderMaterial",{ref:o,uniforms:{uTime:{value:0},uColor:{value:new s("hotpink")}},"uniforms-uColor-value":a?"royalblue":"hotpink",vertexShader:m,fragmentShader:v})]})}function d(){return e.jsx(t,{camera:{position:[0,0,2.5]},children:e.jsx(l,{})})}export{d as default};
