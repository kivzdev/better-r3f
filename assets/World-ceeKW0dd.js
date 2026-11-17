var ht=Object.defineProperty;var pt=(a,e,s)=>e in a?ht(a,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):a[e]=s;var f=(a,e,s)=>(pt(a,typeof e!="symbol"?e+"":e,s),s);import{r as C,j as v,u as ft}from"./index-mQOZ9rCY.js";import{K as ie,a as He,p as Te,u as mt,S as vt,G as xt,b as gt,H as yt,i as se,f as re,c as wt,d as ae,e as Ve,g as bt,h as Tt,r as Mt}from"./shared-nGuPUG8s.js";import{b6 as Ft,fQ as We,G as Pt,C as B,v as Re,I as St,bD as qe,g as Dt,a8 as $e,e as me,V,t as Ce,ag as Se,ac as Rt,H as Qe,aJ as Ke,k as Le,aQ as de,aK as Xe,aj as Ae,aU as Ze,aM as he,W as ne,_ as Oe,f as I,B as Ct,b0 as At,z as It,q as _t,am as Q,ab as jt,U as ve,aE as Et,E as J,aw as Ut,aa as Vt,A as qt}from"./Canvas-DpR0H_vE.js";import{u as le}from"./disposable-X9Ws0gR3.js";import{a as Lt,u as Ie}from"./hooks-DuE23wJx.js";import"./index-BKIKQNXN.js";const ze=new me,Ot=new me,Ge=new me,oe=[];let zt;class Gt extends Pt{constructor(){super(...arguments),this.isInstanceProxy=!0,this.color=new B(1,1,1),this.instanceId=-1,this.mesh=null}get geometry(){var e;return(e=this.mesh)==null?void 0:e.geometry}raycast(e,s){const r=this.mesh;if(!r||this.instanceId<0||this.instanceId>=r.count)return;const i=zt??(zt=new Re);i.geometry=r.geometry,i.material=r.material,r.getMatrixAt(this.instanceId,Ge),i.matrixWorld.multiplyMatrices(r.matrixWorld,Ge),i.raycast(e,oe);for(let n=0;n<oe.length;n++){const o=oe[n];o.instanceId=this.instanceId,o.object=this,s.push(o)}oe.length=0}}function Be(a,e,s){let r=e+s;const i=a.updateRanges;if(i){for(const n of i)e=Math.min(e,n.start),r=Math.max(r,n.start+n.count);a.clearUpdateRanges(),a.addUpdateRange(e,r-e)}else{const n=a.updateRange;n.count!==-1&&(r=Math.max(r,n.offset+n.count),e=Math.min(e,n.offset)),n.offset=e,n.count=r-e}a.needsUpdate=!0}function Bt(a,e,s,r){for(let i=0;i<r;i++)if(a[e+i]!==Math.fround(s[i])){for(let n=i;n<r;n++)a[e+n]=s[n];return!0}return!1}class kt extends St{constructor(e=1e3){super(void 0,void 0,e),this.isInstancesMesh=!0,this.range=1/0,this.proxies=[],this.boundsGeometry=null,this.count=0,this.instanceMatrix.setUsage(qe),this.instanceColor=new Dt(new Float32Array(e*3).fill(1),3),this.instanceColor.setUsage(qe)}attachProxy(e){var s;e.mesh!==this&&((s=e.mesh)==null||s.detachProxy(e),e.mesh=this,e.instanceId=this.proxies.push(e)-1)}detachProxy(e){const s=e.instanceId;if(e.mesh!==this||this.proxies[s]!==e)return;const r=this.proxies.pop();r!==e&&(this.proxies[s]=r,r.instanceId=s),e.mesh=null,e.instanceId=-1}updateMatrixWorld(e){super.updateMatrixWorld(e),this.syncInstances()}syncInstances(){const e=this.proxies,s=this.instanceMatrix.array,r=this.instanceColor.array,i=Math.floor(Math.max(0,Math.min(e.length,this.instanceMatrix.count,this.range)));let n=i,o=-1,l=i,h=-1,c=!1,u=1/0,T=1/0,p=1/0,t=-1/0,d=-1/0,g=-1/0,m=0;for(let y=0;y<i;y++){const w=e[y];let x;w.parent===this?x=w.matrix.elements:(c||(ze.copy(this.matrixWorld).invert(),c=!0),x=Ot.multiplyMatrices(ze,w.matrixWorld).elements),Bt(s,y*16,x,16)&&(y<n&&(n=y),o=y);const j=x[12],U=x[13],L=x[14];j<u&&(u=j),j>t&&(t=j),U<T&&(T=U),U>d&&(d=U),L<p&&(p=L),L>g&&(g=L);const N=x[0]*x[0]+x[1]*x[1]+x[2]*x[2]+x[4]*x[4]+x[5]*x[5]+x[6]*x[6]+x[8]*x[8]+x[9]*x[9]+x[10]*x[10];N>m&&(m=N);const H=w.color,A=y*3;(r[A]!==Math.fround(H.r)||r[A+1]!==Math.fround(H.g)||r[A+2]!==Math.fround(H.b))&&(r[A]=H.r,r[A+1]=H.g,r[A+2]=H.b,y<l&&(l=y),h=y)}const M=this.geometry,P=o>=0||i!==this.count||M!==this.boundsGeometry;if(this.count=i,o>=0&&Be(this.instanceMatrix,n*16,(o-n+1)*16),h>=0&&Be(this.instanceColor,l*3,(h-l+1)*3),P){this.boundsGeometry=M,this.boundingBox=null;const y=this.boundingSphere??(this.boundingSphere=new $e);if(i===0)y.makeEmpty();else{M.boundingSphere===null&&M.computeBoundingSphere();const w=M.boundingSphere;y.center.set((u+t)/2,(T+d)/2,(p+g)/2),y.radius=Math.hypot(t-u,d-T,g-p)/2+Math.sqrt(m)*(w.center.length()+w.radius)}}}}const Je=C.createContext(null);function Ye({ref:a,limit:e=1e3,range:s,children:r,...i}){const n=le(()=>new kt(e),[e]);return C.useImperativeHandle(a,()=>n,[n]),v.jsx("primitive",{object:n,range:s??1/0,...i,children:v.jsx(Je.Provider,{value:n,children:r})})}function _e({ref:a,...e}){const s=C.useContext(Je);if(!s)throw new Error("better-r3f: <InstanceItem> has to be rendered inside <Instances>");const[r]=C.useState(()=>new Gt);return C.useImperativeHandle(a,()=>r,[r]),Ft(()=>(s.attachProxy(r),()=>s.detachProxy(r)),[s,r]),v.jsx("primitive",{object:r,...e})}We(Ye);We(_e);const pe=1/60;function K(){return new Ke(1,1,{depthBuffer:!1,stencilBuffer:!1,minFilter:Le,magFilter:Le,format:de,type:Xe})}const Nt=`
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;function $(a,e){return new Ae({vertexShader:Nt,fragmentShader:a,uniforms:{uTexel:{value:new V(1,1)},...e},depthTest:!1,depthWrite:!1})}const Ht=`
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float l = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float t = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  gl_FragColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}
`,Wt=`
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlStrength;
uniform vec2 uPointer;
uniform vec2 uPointerVel;
uniform float uAspect;
uniform float uRadius;
uniform float uForce;
varying vec2 vUv;
void main() {
  float l = abs(texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x);
  float r = abs(texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x);
  float t = abs(texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x);
  float b = abs(texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x);
  float c = texture2D(uCurl, vUv).x;
  vec2 force = vec2(t - b, r - l);
  float len = length(force);
  force = len > 1e-4 ? force / len : vec2(0.0);
  force *= uCurlStrength * c;
  force.y *= -1.0;
  vec2 vel = texture2D(uVelocity, vUv).xy + force * ${pe};
  vec2 d = vUv - uPointer;
  d.x *= uAspect;
  vel += uPointerVel * uForce * ${pe} * exp(-dot(d, d) / uRadius);
  gl_FragColor = vec4(clamp(vel, vec2(-2000.0), vec2(2000.0)), 0.0, 1.0);
}
`,$t=`
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float l = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float b = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}
`,Qt=`
uniform sampler2D uSource;
uniform float uScale;
varying vec2 vUv;
void main() { gl_FragColor = texture2D(uSource, vUv) * uScale; }
`,Kt=`
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float div = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((l + r + t + b - div) * 0.25, 0.0, 0.0, 1.0);
}
`,Xt=`
uniform sampler2D uVelocity;
uniform sampler2D uPressure;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  gl_FragColor = vec4(texture2D(uVelocity, vUv).xy - vec2(r - l, t - b), 0.0, 1.0);
}
`,Zt=`
uniform sampler2D uVelocity;
uniform vec2 uTexel;
uniform float uDissipation;
varying vec2 vUv;
void main() {
  vec2 back = clamp(vUv - texture2D(uVelocity, vUv).xy * uTexel * ${pe}, 0.0, 1.0);
  gl_FragColor = vec4(texture2D(uVelocity, back).xy / (1.0 + uDissipation * ${pe}), 0.0, 1.0);
}
`;class Jt{constructor(e){f(this,"width",1);f(this,"height",1);f(this,"velocity",[K(),K()]);f(this,"pressure",[K(),K()]);f(this,"curl",K());f(this,"divergence",K());f(this,"curlPass",$(Ht,{uVelocity:{value:null}}));f(this,"forcesPass");f(this,"divergencePass",$($t,{uVelocity:{value:null}}));f(this,"fadePass",$(Qt,{uSource:{value:null},uScale:{value:.8}}));f(this,"pressurePass",$(Kt,{uPressure:{value:null},uDivergence:{value:null}}));f(this,"gradientPass",$(Xt,{uVelocity:{value:null},uPressure:{value:null}}));f(this,"advectPass");f(this,"scene",new Rt);f(this,"camera",new Qe(-1,1,1,-1,0,1));f(this,"quad");this.options=e,this.forcesPass=$(Wt,{uVelocity:{value:null},uCurl:{value:null},uCurlStrength:{value:e.curl},uPointer:{value:new V(-1,-1)},uPointerVel:{value:new V},uAspect:{value:1},uRadius:{value:e.radius*e.radius},uForce:{value:e.force}}),this.advectPass=$(Zt,{uVelocity:{value:null},uDissipation:{value:e.dissipation}});const s=new Ce;s.setAttribute("position",new Se([-1,-1,0,3,-1,0,-1,3,0],3)),this.quad=new Re(s,this.curlPass),this.quad.frustumCulled=!1,this.scene.add(this.quad)}get texture(){return this.velocity[0].texture}setSize(e){const s=this.options.resolution,r=Math.max(1,Math.round(e>=1?s*e:s)),i=Math.max(1,Math.round(e>=1?s:s/e));if(!(r===this.width&&i===this.height)){this.width=r,this.height=i;for(const n of[...this.velocity,...this.pressure,this.curl,this.divergence])n.setSize(r,i);for(const n of[this.curlPass,this.forcesPass,this.divergencePass,this.pressurePass,this.gradientPass,this.advectPass])n.uniforms.uTexel.value.set(1/r,1/i);this.forcesPass.uniforms.uAspect.value=r/i}}draw(e,s,r){this.quad.material=s,e.setRenderTarget(r),e.render(this.scene,this.camera)}swap(e){const s=e[0];e[0]=e[1],e[1]=s}step(e,s,r){const i=this.velocity;this.curlPass.uniforms.uVelocity.value=i[0].texture,this.draw(e,this.curlPass,this.curl);const n=this.forcesPass.uniforms;n.uVelocity.value=i[0].texture,n.uCurl.value=this.curl.texture,n.uPointer.value.copy(s),n.uPointerVel.value.copy(r),this.draw(e,this.forcesPass,i[1]),this.swap(i),this.divergencePass.uniforms.uVelocity.value=i[0].texture,this.draw(e,this.divergencePass,this.divergence);const o=this.pressure;this.fadePass.uniforms.uSource.value=o[0].texture,this.draw(e,this.fadePass,o[1]),this.swap(o),this.pressurePass.uniforms.uDivergence.value=this.divergence.texture;for(let l=0;l<this.options.iterations;l++)this.pressurePass.uniforms.uPressure.value=o[0].texture,this.draw(e,this.pressurePass,o[1]),this.swap(o);this.gradientPass.uniforms.uVelocity.value=i[0].texture,this.gradientPass.uniforms.uPressure.value=o[0].texture,this.draw(e,this.gradientPass,i[1]),this.swap(i),this.advectPass.uniforms.uVelocity.value=i[0].texture,this.draw(e,this.advectPass,i[1]),this.swap(i),e.setRenderTarget(null)}dispose(){for(const e of[...this.velocity,...this.pressure,this.curl,this.divergence])e.dispose();for(const e of[this.curlPass,this.forcesPass,this.divergencePass,this.fadePass,this.pressurePass,this.gradientPass,this.advectPass])e.dispose();this.quad.geometry.dispose()}}const Yt=new Qe(-1,1,1,-1,0,1);class es extends Ce{constructor(){super(),this.setAttribute("position",new Se([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Se([0,2,0,0,2,0],2))}}const ts=new es;class ss{constructor(e){this._mesh=new Re(ts,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Yt)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class rs{constructor(e,s,r){this.variables=[],this.currentTextureIndex=0;let i=he;const n={passThruTexture:{value:null}},o=c(T(),n),l=new ss(o);this.setDataType=function(p){return i=p,this},this.addVariable=function(p,t,d){const g=this.createShaderMaterial(t),m={name:p,initialValueTexture:d,material:g,dependencies:null,renderTargets:[],wrapS:null,wrapT:null,minFilter:ne,magFilter:ne};return this.variables.push(m),m},this.setVariableDependencies=function(p,t){p.dependencies=t},this.init=function(){if(r.capabilities.maxVertexTextures===0)return"No support for vertex shader textures.";for(let p=0;p<this.variables.length;p++){const t=this.variables[p];t.renderTargets[0]=this.createRenderTarget(e,s,t.wrapS,t.wrapT,t.minFilter,t.magFilter),t.renderTargets[1]=this.createRenderTarget(e,s,t.wrapS,t.wrapT,t.minFilter,t.magFilter),this.renderTexture(t.initialValueTexture,t.renderTargets[0]),this.renderTexture(t.initialValueTexture,t.renderTargets[1]);const d=t.material,g=d.uniforms;if(t.dependencies!==null)for(let m=0;m<t.dependencies.length;m++){const M=t.dependencies[m];if(M.name!==t.name){let P=!1;for(let y=0;y<this.variables.length;y++)if(M.name===this.variables[y].name){P=!0;break}if(!P)return"Variable dependency not found. Variable="+t.name+", dependency="+M.name}g[M.name]={value:null},d.fragmentShader=`
uniform sampler2D `+M.name+`;
`+d.fragmentShader}}return this.currentTextureIndex=0,null},this.compute=function(){const p=this.currentTextureIndex,t=this.currentTextureIndex===0?1:0;for(let d=0,g=this.variables.length;d<g;d++){const m=this.variables[d];if(m.dependencies!==null){const M=m.material.uniforms;for(let P=0,y=m.dependencies.length;P<y;P++){const w=m.dependencies[P];M[w.name].value=w.renderTargets[p].texture}}this.doRenderTarget(m.material,m.renderTargets[t])}this.currentTextureIndex=t},this.getCurrentRenderTarget=function(p){return p.renderTargets[this.currentTextureIndex]},this.getAlternateRenderTarget=function(p){return p.renderTargets[this.currentTextureIndex===0?1:0]},this.dispose=function(){l.dispose();const p=this.variables;for(let t=0;t<p.length;t++){const d=p[t];d.initialValueTexture&&d.initialValueTexture.dispose();const g=d.renderTargets;for(let m=0;m<g.length;m++)g[m].dispose()}};function h(p){p.defines.resolution="vec2( "+e.toFixed(1)+", "+s.toFixed(1)+" )"}this.addResolutionDefine=h;function c(p,t){t=t||{};const d=new Ae({name:"GPUComputationShader",uniforms:t,vertexShader:u(),fragmentShader:p});return h(d),d}this.createShaderMaterial=c,this.createRenderTarget=function(p,t,d,g,m,M){return p=p||e,t=t||s,d=d||Oe,g=g||Oe,m=m||ne,M=M||ne,new Ke(p,t,{wrapS:d,wrapT:g,minFilter:m,magFilter:M,format:de,type:i,depthBuffer:!1})},this.createTexture=function(){const p=new Float32Array(e*s*4),t=new Ze(p,e,s,de,he);return t.needsUpdate=!0,t},this.renderTexture=function(p,t){n.passThruTexture.value=p,this.doRenderTarget(o,t),n.passThruTexture.value=null},this.doRenderTarget=function(p,t){const d=r.getRenderTarget(),g=r.xr.enabled,m=r.shadowMap.autoUpdate;r.xr.enabled=!1,r.shadowMap.autoUpdate=!1,l.material=p,r.setRenderTarget(t),l.render(r),l.material=o,r.xr.enabled=g,r.shadowMap.autoUpdate=m,r.setRenderTarget(d)};function u(){return`void main()	{

	gl_Position = vec4( position, 1.0 );

}
`}function T(){return`uniform sampler2D passThruTexture;

void main() {

	vec2 uv = gl_FragCoord.xy / resolution.xy;

	gl_FragColor = texture2D( passThruTexture, uv );

}
`}}}const et=.055,je=`
uvec3 pcg3d(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 rand3(uvec3 v) { return vec3(pcg3d(v)) * (1.0 / 4294967295.0); }
`,as=`
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v, out vec3 gradient) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  vec4 m2 = m * m;
  vec4 m4 = m2 * m2;
  vec4 pdotx = vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3));
  vec4 temp = m2 * m * pdotx;
  gradient = -8.0 * (temp.x * x0 + temp.y * x1 + temp.z * x2 + temp.w * x3);
  gradient += m4.x * p0 + m4.y * p1 + m4.z * p2 + m4.w * p3;
  gradient *= 105.0;
  return 105.0 * dot(m4, pdotx);
}
vec3 curl(vec3 p) {
  vec3 g1, g2;
  snoise(p, g1);
  snoise(p + vec3(31.416, -17.32, 9.71), g2);
  return cross(g1, g2);
}
`,ns=`
uniform sampler2D uFluid;
uniform float uFluidScale;
uniform float uAspect;
uniform vec3 uFollow;
uniform float uTime;
uniform float uDt;
uniform float uFrame;
uniform float uMerge;
uniform int uReps;
uniform int uSideI;
${je}
${as}
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 P = texelFetch(texturePos, ij, 0);
  vec3 p = P.xyz;
  float life = P.w;

  if (uMerge > 0.0) {
    // gathering onto the representatives, still alive
    int rep = (ij.y * uSideI + ij.x) % uReps;
    vec3 onto = texelFetch(texturePos, ivec2(rep % uSideI, rep / uSideI), 0).xyz;
    p = mix(p, onto, 1.0 - exp(-uDt * mix(2.0, 22.0, uMerge)));
    gl_FragColor = vec4(p, max(life, 0.25));
    return;
  }

  life -= uDt * 0.72;
  if (life < 0.0) {
    // born again in a small ball round the pointer, which pulses a little
    vec3 r = rand3(uvec3(uvec2(ij), uint(uFrame)));
    vec3 q = rand3(uvec3(uvec2(ij), uint(uFrame) + 7919u));
    vec3 dir = normalize(vec3(r.x, r.y, q.x) * 2.0 - 1.0 + 1e-4);
    float radius = pow(r.z, 0.333) * ${et} * (1.0 + sin(uTime * 15.0) * 0.2);
    p = uFollow + dir * vec3(1.0, 1.0, 0.6) * radius;
    life = 0.5 + fract(q.y * 21.4131 + uTime);
  } else {
    // drawn back towards the pointer, less the farther it is; carried along the drifting curl current; swept by the wake
    vec3 delta = uFollow - p;
    p += delta * (0.3 + 0.6 * life) * (1.0 - smoothstep(0.2, 0.9, length(delta.xy))) * uDt;
    p += curl(p * 4.6 + vec3(0.0, 0.0, uTime * 0.22)) * 0.034 * uDt;
    vec2 wake = texture2D(uFluid, vec2(p.x / uAspect, p.y)).xy * uFluidScale;
    p.xy += wake * 0.9 * uDt;
  }
  gl_FragColor = vec4(p, life);
}
`,os=`
uniform sampler2D uReps;
uniform int uCount;
uniform int uSideI;
${je}
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  int rep = (ij.y * uSideI + ij.x) % uCount;
  vec2 p = texelFetch(uReps, ivec2(rep % uSideI, rep / uSideI), 0).xy;
  gl_FragColor = vec4(p, 0.0, 0.3 + rand3(uvec3(uvec2(ij), 11u)).x * 1.1);
}
`,is=`
uniform sampler2D uPos;
uniform int uSide;
uniform float uAspect;
uniform float uSize;
uniform float uTime;
uniform float uHandoff;
uniform int uReps;
varying vec3 vColor;
${je}
const vec3 YELLOW = vec3(0.992, 0.851, 0.0);
const vec3 ORANGE_RED = vec3(1.0, 0.29, 0.11);
void main() {
  ivec2 ij = ivec2(gl_VertexID % uSide, gl_VertexID / uSide);
  vec4 P = texelFetch(uPos, ij, 0);
  gl_Position = vec4(P.x / uAspect * 2.0 - 1.0, P.y * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uSize;
  // yellow when it's born, orange-red as it ages; the stream as a whole drifts between the two
  float seed = rand3(uvec3(uvec2(ij), 5u)).x;
  float age = clamp(1.0 - P.w, 0.0, 1.0);
  float drift = 0.5 + 0.5 * sin(uTime * 0.8 + seed * 2.4);
  vec3 own = mix(YELLOW, ORANGE_RED, clamp(age * 0.9 + drift * 0.3 - 0.1, 0.0, 1.0));
  // while handing over, every particle wears its representative's colour, so a few thousand can stand in for all
  int rep = (ij.y * uSide + ij.x) % uReps;
  float k = rand3(uvec3(uvec2(ivec2(rep % uSide, rep / uSide)), 13u)).x;
  vColor = mix(own, mix(YELLOW, ORANGE_RED, 0.2 + 0.55 * k), uHandoff);
}
`,ls=`
varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, 1.0); }
`;class cs{constructor(e,s,r){f(this,"side");f(this,"count");f(this,"points");f(this,"float");f(this,"gpu");f(this,"pos");f(this,"material");f(this,"seedPass");f(this,"reps",null);f(this,"repCount",1);f(this,"frame",0);f(this,"follow",new I);this.side=s,this.count=s*s,this.gpu=new rs(s,s,e),this.float=e.extensions.has("EXT_color_buffer_float"),this.gpu.setDataType(this.float?he:Xe);const i=this.gpu.createTexture(),n=i.image.data;for(let h=0;h<this.count;h++)n[h*4]=Math.random()*r,n[h*4+1]=Math.random(),n[h*4+3]=Math.random();this.pos=this.gpu.addVariable("texturePos",ns,i),this.gpu.setVariableDependencies(this.pos,[this.pos]),Object.assign(this.pos.material.uniforms,{uFluid:{value:null},uFluidScale:{value:1},uAspect:{value:r},uFollow:{value:new I(r/2,.5,0)},uTime:{value:0},uDt:{value:0},uFrame:{value:0},uMerge:{value:0},uReps:{value:1},uSideI:{value:s}});const o=this.gpu.init();if(o)throw new Error(o);i.dispose(),this.seedPass=this.gpu.createShaderMaterial(os,{uReps:{value:null},uCount:{value:1},uSideI:{value:s}});const l=new Ce;l.setAttribute("position",new Ct(new Uint8Array(this.count),1)),l.boundingSphere=new $e(new I,1e4),this.material=new Ae({vertexShader:is,fragmentShader:ls,uniforms:{uPos:{value:null},uSide:{value:s},uAspect:{value:r},uSize:{value:2},uTime:{value:0},uHandoff:{value:0},uReps:{value:1}},depthTest:!1,depthWrite:!1,blending:At}),this.points=new It(l,this.material),this.points.frustumCulled=!1,this.points.renderOrder=10}seed(e,s){var n;const r=Math.ceil(s/this.side);(!this.reps||this.reps.image.height!==r)&&((n=this.reps)==null||n.dispose(),this.reps=new Ze(new Float32Array(this.side*r*4),this.side,r,de,he));const i=this.reps.image.data;for(let o=0;o<s;o++)i[o*4]=e[o*2],i[o*4+1]=e[o*2+1];this.reps.needsUpdate=!0,this.repCount=s,this.seedPass.uniforms.uReps.value=this.reps,this.seedPass.uniforms.uCount.value=s;for(const o of[this.gpu.getCurrentRenderTarget(this.pos),this.gpu.getAlternateRenderTarget(this.pos)])this.gpu.doRenderTarget(this.seedPass,o)}read(e,s,r){const i=Math.ceil(s/this.side),n=new Float32Array(this.side*i*4);e.readRenderTargetPixels(this.gpu.getCurrentRenderTarget(this.pos),0,0,this.side,i,n);for(let o=0;o<s;o++)r[o*2]=n[o*4],r[o*2+1]=n[o*4+1]}step({dt:e,time:s,aspect:r,follow:i,fluid:n,fluidScale:o,size:l,merge:h,handoff:c}){this.frame++;const u=this.pos.material.uniforms;u.uFluid.value=n,u.uFluidScale.value=o,u.uAspect.value=r,u.uFollow.value.copy(this.follow.set(i.x,i.y,0)),u.uTime.value=s,u.uDt.value=e,u.uFrame.value=this.frame,u.uMerge.value=h,u.uReps.value=this.repCount,this.gpu.compute();const T=this.material.uniforms;T.uPos.value=this.gpu.getCurrentRenderTarget(this.pos).texture,T.uAspect.value=r,T.uTime.value=s,T.uSize.value=l,T.uHandoff.value=c,T.uReps.value=this.repCount}dispose(){var e;this.gpu.dispose(),(e=this.reps)==null||e.dispose(),this.seedPass.dispose(),this.points.geometry.dispose(),this.material.dispose()}}function us(){const a=new _t({flatShading:!0,roughness:.6,metalness:0,toneMapped:!1}),e={shape:new Q(1,0,0,0),flat:{value:0}};return a.onBeforeCompile=s=>{s.uniforms.uShape={value:e.shape},s.uniforms.uFlat=e.flat,s.vertexShader=s.vertexShader.replace("#include <common>",`#include <common>
        uniform vec4 uShape;
        vec3 shapeOf(vec3 p) {
          vec3 dir = normalize(p);
          vec3 gem = dir / (abs(dir.x) + abs(dir.y) + abs(dir.z)) * 0.62;
          vec3 tile = vec3(p.xy, p.z * 0.02);
          return p * uShape.x + gem * uShape.y + dir * 0.5 * uShape.z + tile * uShape.w;
        }`).replace("#include <begin_vertex>","vec3 transformed = shapeOf(vec3(position));"),s.fragmentShader=s.fragmentShader.replace("#include <common>",`#include <common>
uniform float uFlat;`).replace("#include <opaque_fragment>",`outgoingLight = mix(outgoingLight, diffuseColor.rgb, uFlat);
#include <opaque_fragment>`)},a.customProgramCacheKey=()=>"better-r3f-morph",Object.assign(a,{morph:e})}function ds(a){return new jt(1,1,1,a,a,a)}function tt(a,e,s,r=[0,0,0]){return a=Math.imul(a,1664525)+1013904223>>>0,e=Math.imul(e,1664525)+1013904223>>>0,s=Math.imul(s,1664525)+1013904223>>>0,a=a+Math.imul(e,s)>>>0,e=e+Math.imul(s,a)>>>0,s=s+Math.imul(a,e)>>>0,a=(a^a>>>16)>>>0,e=(e^e>>>16)>>>0,s=(s^s>>>16)>>>0,a=a+Math.imul(e,s)>>>0,e=e+Math.imul(s,a)>>>0,s=s+Math.imul(a,e)>>>0,r[0]=a/4294967295,r[1]=e/4294967295,r[2]=s/4294967295,r}function hs(a){let e=a>>>0;return()=>(e=Math.imul(e,1664525)+1013904223>>>0,e/4294967296)}function Me(a){const e=new Float32Array(a*4);for(let s=0;s<a;s++)e[s*4+3]=1;return{n:a,pos:new Float32Array(a*3),rot:e,scale:new Float32Array(a*3).fill(1),color:new Float32Array(a*3).fill(1)}}function ps(a,e){e.pos.set(a.pos),e.rot.set(a.rot),e.scale.set(a.scale),e.color.set(a.color)}const Fe=()=>({position:new I,quaternion:new ve,fov:50}),fe=new me,ke=new ve,Ne=new Et,X=new I,fs=new B,st=new I(0,1,0);function xe(a,e,s,r,i,n,o,l){return a.position.set(e,s,r),fe.lookAt(a.position,X.set(i,n,o),st),a.quaternion.setFromRotationMatrix(fe),a.fov=l,a}const ge=(a,e,s)=>{a.color[e*3]=s.r,a.color[e*3+1]=s.g,a.color[e*3+2]=s.b};function ms(a){const e=Math.round(Math.sqrt(a)),s=1.3,r=Array.from({length:a},(o,l)=>{const h=(l%e-(e-1)/2)*s,c=(Math.floor(l/e)-(e-1)/2)*s,u=Math.hypot(h,c);return{x:h,z:c,distance:u,color:He(u/(e*s*.7)).clone()}}),i=(o,l)=>{for(let h=0;h<a;h++){const c=r[h],u=Math.sin(c.distance*.32-l*2.4);o.pos[h*3]=c.x,o.pos[h*3+1]=u*1.3,o.pos[h*3+2]=c.z,o.scale[h*3]=1,o.scale[h*3+1]=1.6+u,o.scale[h*3+2]=1,o.rot.fill(0,h*4,h*4+3),o.rot[h*4+3]=1,ge(o,h,c.color)}},n=new ve().setFromAxisAngle(st,.13);return{id:"instancing",shape:new Q(1,0,0,0),flat:0,camera(o,l,h){const c=e*.7;return xe(h,Math.sin(o*.1)*c,e*.46,Math.cos(o*.1)*c,0,-4,0,35),h.quaternion.multiply(n),h},start:o=>i(o,0),update:(o,l)=>i(o,l)}}function vs(a,e){const r=Math.PI*(3-Math.sqrt(5)),i=Array.from({length:e},(o,l)=>{const h=1-l/(e-1)*2,c=Math.sqrt(1-h*h),u=r*l;return{base:new I(Math.cos(u)*c*9.5,h*9.5,Math.sin(u)*c*9.5),color:He((1-h)/2).clone(),speed:.6+l*7919%100/100}}),n=(o,l,h)=>{fe.makeRotationFromEuler(Ne.set(.35,l*.15,.12));for(let c=0;c<a;c++){const u=c%e;X.copy(i[u].base).applyMatrix4(fe),o.pos[c*3]=X.x+4.6,o.pos[c*3+1]=X.y,o.pos[c*3+2]=X.z;const T=c<e?1:0;if(o.scale.fill(T,c*3,c*3+3),h){const p=l*i[u].speed;ke.setFromEuler(Ne.set(p,p*.7,0)),ke.toArray(o.rot,c*4)}ge(o,c,i[u].color)}};return{id:"rerenders",shape:new Q(0,1,0,0),flat:0,camera:(o,l,h)=>xe(h,0,0,27,0,0,0,50),start:o=>n(o,0,!0),update:(o,l,h,c)=>n(o,l,c.mode==="better")}}const De={perFrame:0};function xs(a){const s=[{color:new B(ie.yellow),phase:0},{color:new B(ie.pink),phase:2.1},{color:new B(ie.blue),phase:4.2}],r=(c,u)=>2.4+Math.sin(c*.55+s[u].phase)*4.4,i=(c,u)=>Math.sin(c*.8+s[u].phase*1.7)*2.3,n=(c,u)=>Math.cos(c*.55+s[u].phase)*3.4,o=hs(7),l=Array.from({length:a},(c,u)=>{const T=o()*2-1,p=o()*Math.PI*2,t=Math.sqrt(1-T*T),d=new I(Math.cos(p)*t,T,Math.sin(p)*t).multiplyScalar(2+o()*6);d.x+=2.4;const g=new I(o()*2-1,o()*2-1,o()*2-1).normalize();return g.multiplyScalar(.4+o()*1.6),{start:d,position:d.clone(),velocity:new I,offset:g,speed:.05+o()*.07,group:u%s.length}}),h=c=>{for(let u=0;u<a;u++){const T=l[u];T.position.toArray(c.pos,u*3),c.scale.fill(.11,u*3,u*3+3),c.rot.fill(0,u*4,u*4+3),c.rot[u*4+3]=1,ge(c,u,s[T.group].color)}};return{id:"pool",shape:new Q(0,0,1,0),flat:.65,camera:(c,u,T)=>xe(T,0,2.5,15,0,0,0,50),start(c){for(const u of l)u.position.copy(u.start),u.velocity.set(0,0,0);h(c)},update(c,u,T,p){if(p.mode==="classic"){for(let t=0;t<a;t++){const{position:d,velocity:g,offset:m,speed:M,group:P}=l[t],y=new I(r(u,P),i(u,P),n(u,P)).add(m),w=new I().subVectors(y,d).setLength(M),x=new I().subVectors(w,g).clampLength(0,.004),j=new I(-m.z,0,m.x).setLength(.004*.5);g.add(x).add(j).clampLength(0,M),d.add(g)}De.perFrame=a*4}else{const t=p.pool,d=t.stats.created;for(let g=0;g<a;g++){const{position:m,velocity:M,offset:P,speed:y,group:w}=l[g],x=t.vector3(r(u,w),i(u,w),n(u,w)).add(P),j=t.vector3().subVectors(x,m).setLength(y),U=t.vector3().subVectors(j,M).clampLength(0,.004),L=t.vector3(-P.z,0,P.x).setLength(.004*.5);M.add(U).add(L).clampLength(0,y),m.add(M)}De.perFrame=t.stats.created-d}h(c)}}}const rt=50,at=15,Y=2*at*Math.tan(J.degToRad(rt/2)),Ee=2;new B(ie.yellow);new B("#ff4a1c");const ce=[0,0,0];function gs(a,e,s,r){tt(a%e,Math.floor(a/e),3,ce);const i=Math.sqrt(ce[0])*et*1.6,n=ce[1]*Math.PI*2;return r.set(s.x+Math.cos(n)*i,s.y+Math.sin(n)*i)}function nt(a,e,s){const r=.2+.55*tt(a%e,Math.floor(a/e),13,ce)[0];return s.setRGB(J.lerp(.992,1,r),J.lerp(.851,.29,r),J.lerp(0,.11,r),Ut),s}function ot(a,e,s,r){return r.set((a-s/2)*Y,(e-.5)*Y,0)}function ys(a){const e=new V;return{id:"fluid",shape:new Q(0,0,0,1),flat:1,camera:(s,r,i)=>xe(i,0,0,at,0,0,0,rt),start(s,r){const i=Ee/r.height*Y;for(let n=0;n<a;n++)gs(n,r.fluidSide,r.center,e),ot(e.x,e.y,r.aspect,X).toArray(s.pos,n*3),s.scale[n*3]=i,s.scale[n*3+1]=i,s.scale[n*3+2]=i,s.rot.fill(0,n*4,n*4+3),s.rot[n*4+3]=1,ge(s,n,nt(n,r.fluidSide,fs))},update(){}}}const ws={BetterFluid:"fluid",BetterInstancing:"instancing",BetterRerenders:"rerenders",BetterPool:"pool"},Pe=["fluid","instancing","rerenders","pool"],bs={fluid:"BetterFluid",instancing:"BetterInstancing",rerenders:"BetterRerenders",pool:"BetterPool"},ee=typeof matchMedia<"u"&&matchMedia("(pointer: coarse)").matches,F=ee?2500:1e4,ue=ee?700:1600,Z=ee?256:1024,it={count:0};function lt(a,e,s,r){const i=new Float32Array(257),n=(l,h,c)=>3*h*l*(1-l)**2+3*c*l*l*(1-l)+l**3;let o=0;for(let l=0;l<=256;l++){const h=l/256;for(;o<1&&n(o,a,s)<h;)o+=1/4096;i[l]=n(o,e,r)}return l=>{const h=Math.min(Math.max(l,0),1)*256,c=Math.floor(h);return c>=256?i[256]:i[c]+(i[c+1]-i[c])*(h-c)}}const Ts=lt(.45,0,.1,1),Ms=lt(.65,0,.1,1),q={x:0,y:0,seen:!1,at:0,out:!1};function Fs(){const a=s=>{q.x=s.clientX,q.y=s.clientY,q.seen=!0,q.out=!1,q.at=performance.now()},e=s=>{s.relatedTarget||(q.out=!0)};return addEventListener("pointermove",a,{passive:!0}),addEventListener("pointerdown",a,{passive:!0}),document.documentElement.addEventListener("pointerleave",e),()=>{removeEventListener("pointermove",a),removeEventListener("pointerdown",a),document.documentElement.removeEventListener("pointerleave",e)}}class Ps{constructor(e,s){f(this,"sim",new Jt({resolution:ee?112:160,curl:30,force:4800,radius:.07,dissipation:.8,iterations:20}));f(this,"flow");f(this,"time",0);f(this,"at",new V(-1,-1));f(this,"follow",new V(-1,-1));f(this,"last",new V);f(this,"uv",new V);f(this,"push",new V);f(this,"speed",new V);this.flow=new cs(e,s,1.6)}step(e,s,r,i,n,o){this.sim.setSize(r),this.at.x<0&&this.last.copy(n),this.at.copy(n),this.speed.lerp(this.push.subVectors(this.at,this.last).divideScalar(Math.max(s,1e-4)),.35),this.speed.multiplyScalar(Math.exp(-6*s)),this.last.copy(this.at),this.uv.set(this.at.x/r,this.at.y),this.push.set(this.speed.x/r,this.speed.y),this.sim.step(e,this.uv,o>0?this.push.set(0,0):this.push),this.follow.x<0&&this.follow.copy(n),this.follow.lerp(n,1-Math.exp(-s*13));const l=Math.min(this.time/.8,1);this.flow.step({dt:s,time:this.time,aspect:r,follow:this.follow,fluid:this.sim.texture,fluidScale:1/this.sim.height,size:Ee*e.getPixelRatio(),merge:o,handoff:Math.max(o,1-l*l*(3-2*l))}),this.time+=s}dispose(){this.sim.dispose(),this.flow.dispose()}}function ct({index:a,speed:e,proxies:s}){it.count++;const[r,i]=C.useState(0);return Ie((n,o)=>i(l=>l+o*e)),v.jsx(_e,{ref:n=>void(s.current[a]=n),rotation:[r,r*.7,0]})}ct.displayName="StateGem";function Ss({layout:a}){const e=C.useRef([]),s=C.useMemo(()=>Array.from({length:F},(r,i)=>`#${new B().fromArray(a.color,i*3).getHexString()}`),[a]);return Ie(()=>{for(let r=0;r<F;r++){const i=e.current[r];i&&(i.position.fromArray(a.pos,r*3),i.scale.fromArray(a.scale,r*3))}}),v.jsx(v.Fragment,{children:s.map((r,i)=>v.jsxs("mesh",{ref:n=>void(e.current[i]=n),children:[v.jsx("boxGeometry",{}),v.jsx("meshStandardMaterial",{color:r,flatShading:!0,roughness:.6,toneMapped:!1})]},i))})}function Ds({target:a,modes:e}){const s=Lt(P=>P.gl),r=C.useMemo(()=>({fluid:ys(F),instancing:ms(F),rerenders:vs(F,ue),pool:xs(F)}),[]),i=le(()=>ds(ee?1:2),[]),n=le(()=>us(),[]),o=le(()=>new Ps(s,Z),[s]),l=C.useRef(new Array(F).fill(null)),h=C.useRef(null),[c,u]=C.useState(null),T=C.useRef(a);T.current=a;const p=C.useRef(e);p.current=e;const t=C.useMemo(()=>({cur:Me(F),from:Me(F),to:Me(F),delay:new Float32Array(F),arc:new Float32Array(F),xy:new Float32Array(F*2),phase:"start",formation:null,next:null,t:0,phaseAt:0,camFrom:Fe(),camTo:Fe(),cam:Fe(),shapeFrom:new Q,shapeTo:new Q,flatFrom:0,flatTo:0,fluidOn:!1,center:new V,probe:new qt}),[]),d=C.useMemo(()=>({n:F,aspect:1,height:1,mode:"better",pool:null,center:t.center,fluidCount:Z**2,fluidSide:Z}),[t]);C.useEffect(()=>Fs(),[]);const g=c==="rerenders"&&e.rerenders==="classic",m=c==="instancing"&&e.instancing==="classic",M=C.useMemo(()=>{const P=y=>.6+y*7919%100/100;return Array.from({length:F},(y,w)=>g&&w<ue?v.jsx(ct,{index:w,speed:P(w),proxies:l},`gem${w}`):v.jsx(_e,{ref:x=>void(l.current[w]=x)},w))},[g]);return Ie((P,y)=>{const w=P.clock.elapsedTime,x=Math.min(y,1/30),{size:j,camera:U,pool:L}=P;d.aspect=j.width/j.height,d.height=j.height,d.pool=L;const N=s.domElement.getBoundingClientRect();q.seen&&!q.out&&performance.now()-q.at<(ee?2600:1e9)?t.center.set((q.x-N.left)/N.height,1-(q.y-N.top)/N.height):t.center.set(d.aspect*.6+Math.sin(w*.37)*.22*d.aspect*.4,.5+Math.sin(w*.51)*.18);const A=r[T.current],ut=b=>p.current[b],ye=b=>{ps(t.cur,t.from),d.mode="better",b.start(t.to,d),b.camera(0,d,t.camTo),t.camFrom.position.copy(U.position),t.camFrom.quaternion.copy(U.quaternion),t.camFrom.fov=U.fov;const D=t.probe;D.fov=t.camTo.fov,D.aspect=d.aspect,D.position.copy(t.camTo.position),D.quaternion.copy(t.camTo.quaternion),D.updateMatrixWorld(),D.updateProjectionMatrix();const O=L.vector3();for(let R=0;R<F;R++){O.fromArray(t.to.pos,R*3).project(D);const S=(R*2654435761>>>0)/4294967296;t.delay[R]=.5*J.clamp((O.x+1)/2,0,1)+.1*S;const z=O.fromArray(t.to.pos,R*3).distanceTo(L.vector3().fromArray(t.from.pos,R*3));t.arc[R]=Math.min(z*.16,3)*(.5+S)}t.shapeFrom.copy(n.morph.shape),t.flatFrom=n.morph.flat.value,t.shapeTo.copy(b.shape),t.flatTo=b.flat,t.next=b,t.phase="morph",t.phaseAt=w,u(null)},Ue=b=>{if(t.formation=b,t.phase="run",t.t=0,n.morph.shape.copy(b.shape),n.morph.flat.value=b.flat,b.id==="fluid"){for(let D=0;D<F;D++)t.xy[D*2]=t.cur.pos[D*3]/Y+d.aspect/2,t.xy[D*2+1]=t.cur.pos[D*3+1]/Y+.5;o.flow.seed(t.xy,F),o.time=0,t.fluidOn=!0}u(b.id)};if(t.phase==="start"?(A.start(t.cur,d),A.camera(0,d,t.cam),Ue(A)):t.phase==="run"&&A!==t.formation&&(t.formation.id==="fluid"?(t.phase="merge",t.phaseAt=w):ye(A)),t.phase==="merge"){const b=Math.min((w-t.phaseAt)/.45,1);if(o.step(s,x,d.aspect,d.height,t.center,b*b*(3-2*b)),b>=1){o.flow.read(s,F,t.xy);const D=Ee/d.height*Y,O=new B,R=new I;for(let S=0;S<F;S++)ot(t.xy[S*2],t.xy[S*2+1],d.aspect,R).toArray(t.cur.pos,S*3),t.cur.scale.fill(D,S*3,S*3+3),t.cur.rot.fill(0,S*4,S*4+3),t.cur.rot[S*4+3]=1,nt(S,Z,O).toArray(t.cur.color,S*3);t.fluidOn=!1,ye(A)}}let we=!1;if(t.phase==="morph"){A!==t.next&&ye(A);const b=w-t.phaseAt,D=1.15,O=.6+D,{from:R,to:S,cur:z}=t;for(let G=0;G<F;G++){const te=Ts((b-t.delay[G])/D),dt=Math.sin(Math.PI*te)*t.arc[G];for(let be=0;be<3;be++){const E=G*3+be;z.pos[E]=R.pos[E]+(S.pos[E]-R.pos[E])*te,z.scale[E]=R.scale[E]+(S.scale[E]-R.scale[E])*te,z.color[E]=R.color[E]+(S.color[E]-R.color[E])*te}z.pos[G*3+1]+=dt,ve.slerpFlat(z.rot,G*4,R.rot,G*4,S.rot,G*4,te)}we=!0;const _=Ms(b/O);t.cam.position.lerpVectors(t.camFrom.position,t.camTo.position,_),t.cam.quaternion.slerpQuaternions(t.camFrom.quaternion,t.camTo.quaternion,_),t.cam.fov=t.camFrom.fov+(t.camTo.fov-t.camFrom.fov)*_;const k=J.smoothstep(_,.15,.85);n.morph.shape.lerpVectors(t.shapeFrom,t.shapeTo,k),n.morph.flat.value=t.flatFrom+(t.flatTo-t.flatFrom)*k,b>=O&&Ue(t.next)}if(t.phase==="run"){const b=t.formation;d.mode=ut(b.id),b.id==="fluid"?o.step(s,x,d.aspect,d.height,t.center,0):b.update(t.cur,t.t,x,d),we=b.id==="rerenders",b.camera(t.t,d,t.cam),t.t+=x}const W=U;if(W.position.copy(t.cam.position),W.quaternion.copy(t.cam.quaternion),(W.fov!==t.cam.fov||W.aspect!==d.aspect)&&(W.fov=t.cam.fov,W.aspect=d.aspect,W.updateProjectionMatrix()),o.flow.points.visible=t.fluidOn,h.current&&(h.current.visible=!t.fluidOn&&!(m&&t.phase==="run")),!t.fluidOn){const b=g&&t.phase==="run"?ue:0,{pos:D,rot:O,scale:R,color:S}=t.cur,z=l.current;for(let _=0;_<F;_++){const k=z[_];k&&(k.position.fromArray(D,_*3),k.scale.fromArray(R,_*3),k.color.fromArray(S,_*3),we&&_>=b&&k.quaternion.fromArray(O,_*4))}}}),v.jsxs(v.Fragment,{children:[v.jsx("hemisphereLight",{args:["#fff6e0","#1d1d24",1.6]}),v.jsx("directionalLight",{position:[20,40,10],intensity:2.2}),v.jsx(Ye,{ref:h,limit:F,geometry:i,material:n,frustumCulled:!1,children:M}),m&&v.jsx(Ss,{layout:t.cur}),v.jsx("primitive",{object:o.flow.points})]})}const Rs=Mt(()=>it.count),Cs={fluid:{title:`Fluid: ${se(Z**2)} particles`,description:v.jsx(v.Fragment,{children:"A million squares stream from the pointer on a drifting curl current, as in Edan Kwan’s The Spirit: born yellow, orange-red as they age, and swept into eddies by the fluid the pointer stirs. Every square is the same; only its colour moves."}),labels:{classic:"dpr={[1, 2]}",better:"adaptiveDpr"},metrics:[{label:"Frames a second",read:re,graph:{max:60}},{label:"Pixel ratio",read:wt,format:ae(2),graph:{min:.5,max:2}},{label:"Time a frame",read:Ve,format:ae(1),unit:"ms"},{label:"Particles",read:()=>Z**2}]},instancing:{title:`Instancing: ${se(F)} cubes`,description:v.jsxs(v.Fragment,{children:["One ",v.jsx("code",{children:"<mesh>"})," per cube is a draw call per cube. ",v.jsx("code",{children:"<Instances>"})," draws them all in one, and uploads only the cubes that moved."]}),labels:{classic:`<mesh> ×${se(F)}`,better:"<Instances>"},metrics:[{label:"Frames a second",read:re,graph:{max:60}},{label:"Time a frame",read:Ve,format:ae(1),unit:"ms",graph:{max:16}},{label:"Draw calls",read:bt}],hints:/meshes use the same BoxGeometry/},rerenders:{title:`Re-renders: ${se(ue)} spinning gems`,description:v.jsxs(v.Fragment,{children:["Setting state in ",v.jsx("code",{children:"useFrame"})," renders the component again 60 times a second; writing to a ref doesn’t render at all. better-r3f spots the first and says how to fix it."]}),labels:{classic:"useState",better:"useRef"},metrics:[{label:"Frames a second",read:re,graph:{max:60}},{label:"Renders a second",read:Rs}],hints:/got new rotation from React/},pool:{title:`Frame pool: ${se(F)} steering particles`,description:v.jsxs(v.Fragment,{children:["Four temporary vectors per particle per frame. Made with ",v.jsx("code",{children:"new"}),", they’re garbage the moment the frame ends; ",v.jsx("code",{children:"state.pool"})," hands the same ones out again on the next."]}),labels:{classic:"new Vector3()",better:"pool.vector3()"},metrics:[{label:"Frames a second",read:re,graph:{max:60}},{label:"New vectors",read:()=>De.perFrame,unit:"a frame"},{label:"Garbage",read:Tt,format:ae(1),unit:"MB/s",graph:{}}]}};function qs({name:a}){const e=ws[a]??"fluid",[,s]=ft(),[r,i]=C.useState(()=>{const l=Te.get("mode")==="classic"?"classic":"better";return{fluid:"better",instancing:"better",rerenders:"better",pool:"better",[e]:l}});mt(),C.useEffect(()=>{if(!Te.has("tour"))return;const o=Pe[(Pe.indexOf(e)+1)%Pe.length],l=setTimeout(()=>s(`/demo/${bs[o]}${location.search}`),Number(Te.get("tour"))||3400);return()=>clearTimeout(l)},[e,s]);const n=Cs[e];return v.jsxs(vt,{children:[v.jsxs(Vt,{dpr:[1,2],adaptiveDpr:e==="fluid"&&r.fluid==="better"?{min:.75}:!1,gl:{antialias:!0,powerPreference:"high-performance"},camera:{fov:50,position:[0,0,15],near:.1,far:600},children:[v.jsx("color",{attach:"background",args:[xt]}),v.jsx(Ds,{target:e,modes:r}),v.jsx(gt,{})]}),v.jsx(yt,{mode:r[e],setMode:o=>i(l=>({...l,[e]:o})),labels:n.labels,title:n.title,description:n.description,metrics:n.metrics,hints:n.hints})]})}export{ws as PARTICLE_DEMOS,qs as default,it as renders};
