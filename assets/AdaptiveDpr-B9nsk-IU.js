import{j as e}from"./index-mQOZ9rCY.js";import{k as d,S as p,p as u,n as l,b as f,H as h,f as v,c as x,d as b,s as y}from"./shared-nGuPUG8s.js";import{aa as g,aj as k,V as w,am as j}from"./Canvas-DpR0H_vE.js";import{a as m,u as M}from"./hooks-DuE23wJx.js";import{u as S}from"./disposable-X9Ws0gR3.js";import"./index-BKIKQNXN.js";const i=Math.round(l("balls",24)),A=l("march",.85),R=`
  uniform vec2 uResolution;
  uniform vec4 uBalls[${i}];
  uniform float uSteps;

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }
  float map(vec3 p) {
    float d = 1e9;
    for (int i = 0; i < ${i}; i++) d = smin(d, length(p - uBalls[i].xyz) - uBalls[i].w, 0.65);
    return d;
  }
  vec3 normalAt(vec3 p) {
    const vec2 k = vec2(1.0, -1.0);
    const float e = 0.0015;
    return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) + k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    vec3 ro = vec3(0.0, 0.0, 5.2);
    vec3 rd = normalize(vec3(uv - vec2(0.18, 0.0), -1.45));
    // the page's ground; rays that miss the balls' bounding sphere stop here
    vec3 color = vec3(0.0784);
    float b = dot(ro, rd);
    float h = b * b - dot(ro, ro) + 3.6 * 3.6;
    if (h > 0.0) {
      float t = max(-b - sqrt(h), 0.0);
      float far = -b + sqrt(h);
      float glow = 0.0;
      bool hit = false;
      for (int i = 0; i < 400; i++) {
        if (float(i) >= uSteps || t > far) break;
        float d = map(ro + rd * t);
        glow += 0.012 / (0.04 + d * d);
        if (d < 0.001) { hit = true; break; }
        t += d * ${A.toFixed(3)};
      }
      // a yellow haze round the balls; the balls lit in the mascot's yellow with a pink and blue rim
      color += glow * vec3(0.99, 0.85, 0.0) * 0.012;
      if (hit) {
        vec3 n = normalAt(ro + rd * t);
        float diffuse = max(dot(n, normalize(vec3(0.6, 0.8, 0.5))), 0.0);
        float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
        vec3 rimColor = mix(vec3(1.0, 0.37, 0.66), vec3(0.0, 0.48, 0.99), 0.5 + 0.5 * n.y);
        color = mix(vec3(0.1), vec3(0.99, 0.85, 0.0), diffuse) + rim * rimColor;
      }
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;function z(){const a=m(r=>r.size),t=m(r=>r.viewport.dpr),n=S(()=>new k({fragmentShader:R,vertexShader:"void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",uniforms:{uResolution:{value:new w},uBalls:{value:Array.from({length:i},()=>new j)},uSteps:{value:l("steps",120)}}}),[]);return n.uniforms.uResolution.value.set(a.width*t,a.height*t),M(({clock:r})=>{const s=r.elapsedTime,c=n.uniforms.uBalls.value;for(let o=0;o<i;o++)c[o].set(Math.sin(s*.61+o*1.7)*1.9,Math.cos(s*.47+o*2.3)*1.1,Math.sin(s*.39+o*.9)*1.2,.5+.12*Math.sin(o*3.1+s))}),e.jsxs("mesh",{frustumCulled:!1,children:[e.jsx("planeGeometry",{args:[2,2]}),e.jsx("primitive",{object:n,attach:"material"})]})}const C=[{label:"Frames a second",read:v,graph:{max:60}},{label:"Pixel ratio",read:x,format:b(2),graph:{min:.75,max:2}},{label:"Pixels a frame",read:()=>{var t;const a=(t=y.gl)==null?void 0:t.domElement;return a?a.width*a.height:0}}];function _(){const[a,t]=d();return e.jsxs(p,{children:[e.jsxs(g,{dpr:u.has("dpr")?l("dpr",2):[1,2],adaptiveDpr:a==="better"?{min:.5}:!1,children:[e.jsx(z,{}),e.jsx(f,{})]},a),e.jsx(h,{mode:a,setMode:t,labels:{classic:"dpr={[1, 2]}",better:"adaptiveDpr"},title:"Adaptive pixel ratio",description:e.jsxs(e.Fragment,{children:["A scene that’s heavy per pixel, on a 2× screen. ",e.jsx("code",{children:"adaptiveDpr"})," lowers the pixel ratio a step at a time while frames run slow, and raises it again once they keep up."]}),metrics:C})]})}export{_ as default};
