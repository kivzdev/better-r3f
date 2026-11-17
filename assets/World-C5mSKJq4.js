var pt=Object.defineProperty;var ft=(a,e,s)=>e in a?pt(a,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):a[e]=s;var m=(a,e,s)=>(ft(a,typeof e!="symbol"?e+"":e,s),s);import{r as C,j as v,u as mt}from"./index-Beq6HHqk.js";import{K as ce,a as We,p as Me,u as vt,S as gt,G as xt,b as yt,H as wt,i as re,f as ne,c as Tt,d as oe,e as qe,g as bt,h as Mt,r as Pt}from"./shared-89Rh1LHb.js";import{b6 as Ft,fQ as ze,G as St,C as $,v as Ie,I as Dt,bD as Le,g as Rt,a8 as Qe,e as ve,V as q,t as Ae,ag as De,ac as Ct,H as Ze,aJ as Xe,k as Oe,aQ as de,aK as Ke,aj as Ve,aU as Je,aM as pe,W as ie,_ as Ge,B as It,f as V,b0 as At,z as Vt,q as _t,am as Z,ab as jt,U as ge,aE as Ut,E as J,aw as Et,aa as qt,A as Lt}from"./Canvas-C7jS8vqv.js";import{u as ue}from"./disposable-Cl74v6bi.js";import{a as Ot,u as _e}from"./hooks-B15QbSzC.js";import"./index-BKIKQNXN.js";const Be=new ve,Gt=new ve,$e=new ve,le=[];let Bt;class $t extends St{constructor(){super(...arguments),this.isInstanceProxy=!0,this.color=new $(1,1,1),this.instanceId=-1,this.mesh=null}get geometry(){var e;return(e=this.mesh)==null?void 0:e.geometry}raycast(e,s){const r=this.mesh;if(!r||this.instanceId<0||this.instanceId>=r.count)return;const i=Bt??(Bt=new Ie);i.geometry=r.geometry,i.material=r.material,r.getMatrixAt(this.instanceId,$e),i.matrixWorld.multiplyMatrices(r.matrixWorld,$e),i.raycast(e,le);for(let n=0;n<le.length;n++){const o=le[n];o.instanceId=this.instanceId,o.object=this,s.push(o)}le.length=0}}function ke(a,e,s){let r=e+s;const i=a.updateRanges;if(i){for(const n of i)e=Math.min(e,n.start),r=Math.max(r,n.start+n.count);a.clearUpdateRanges(),a.addUpdateRange(e,r-e)}else{const n=a.updateRange;n.count!==-1&&(r=Math.max(r,n.offset+n.count),e=Math.min(e,n.offset)),n.offset=e,n.count=r-e}a.needsUpdate=!0}function kt(a,e,s,r){for(let i=0;i<r;i++)if(a[e+i]!==Math.fround(s[i])){for(let n=i;n<r;n++)a[e+n]=s[n];return!0}return!1}class Nt extends Dt{constructor(e=1e3){super(void 0,void 0,e),this.isInstancesMesh=!0,this.range=1/0,this.proxies=[],this.boundsGeometry=null,this.count=0,this.instanceMatrix.setUsage(Le),this.instanceColor=new Rt(new Float32Array(e*3).fill(1),3),this.instanceColor.setUsage(Le)}attachProxy(e){var s;e.mesh!==this&&((s=e.mesh)==null||s.detachProxy(e),e.mesh=this,e.instanceId=this.proxies.push(e)-1)}detachProxy(e){const s=e.instanceId;if(e.mesh!==this||this.proxies[s]!==e)return;const r=this.proxies.pop();r!==e&&(this.proxies[s]=r,r.instanceId=s),e.mesh=null,e.instanceId=-1}updateMatrixWorld(e){super.updateMatrixWorld(e),this.syncInstances()}syncInstances(){const e=this.proxies,s=this.instanceMatrix.array,r=this.instanceColor.array,i=Math.floor(Math.max(0,Math.min(e.length,this.instanceMatrix.count,this.range)));let n=i,o=-1,l=i,u=-1,c=!1,d=1/0,S=1/0,p=1/0,t=-1/0,h=-1/0,x=-1/0,f=0;for(let y=0;y<i;y++){const w=e[y];let g;w.parent===this?g=w.matrix.elements:(c||(Be.copy(this.matrixWorld).invert(),c=!0),g=Gt.multiplyMatrices(Be,w.matrixWorld).elements),kt(s,y*16,g,16)&&(y<n&&(n=y),o=y);const _=g[12],U=g[13],L=g[14];_<d&&(d=_),_>t&&(t=_),U<S&&(S=U),U>h&&(h=U),L<p&&(p=L),L>x&&(x=L);const N=g[0]*g[0]+g[1]*g[1]+g[2]*g[2]+g[4]*g[4]+g[5]*g[5]+g[6]*g[6]+g[8]*g[8]+g[9]*g[9]+g[10]*g[10];N>f&&(f=N);const H=w.color,I=y*3;(r[I]!==Math.fround(H.r)||r[I+1]!==Math.fround(H.g)||r[I+2]!==Math.fround(H.b))&&(r[I]=H.r,r[I+1]=H.g,r[I+2]=H.b,y<l&&(l=y),u=y)}const b=this.geometry,P=o>=0||i!==this.count||b!==this.boundsGeometry;if(this.count=i,o>=0&&ke(this.instanceMatrix,n*16,(o-n+1)*16),u>=0&&ke(this.instanceColor,l*3,(u-l+1)*3),P){this.boundsGeometry=b,this.boundingBox=null;const y=this.boundingSphere??(this.boundingSphere=new Qe);if(i===0)y.makeEmpty();else{b.boundingSphere===null&&b.computeBoundingSphere();const w=b.boundingSphere;y.center.set((d+t)/2,(S+h)/2,(p+x)/2),y.radius=Math.hypot(t-d,h-S,x-p)/2+Math.sqrt(f)*(w.center.length()+w.radius)}}}}const Ye=C.createContext(null);function et({ref:a,limit:e=1e3,range:s,children:r,...i}){const n=ue(()=>new Nt(e),[e]);return C.useImperativeHandle(a,()=>n,[n]),v.jsx("primitive",{object:n,range:s??1/0,...i,children:v.jsx(Ye.Provider,{value:n,children:r})})}function je({ref:a,...e}){const s=C.useContext(Ye);if(!s)throw new Error("better-r3f: <InstanceItem> has to be rendered inside <Instances>");const[r]=C.useState(()=>new $t);return C.useImperativeHandle(a,()=>r,[r]),Ft(()=>(s.attachProxy(r),()=>s.detachProxy(r)),[s,r]),v.jsx("primitive",{object:r,...e})}ze(et);ze(je);const fe=1/60;function X(){return new Xe(1,1,{depthBuffer:!1,stencilBuffer:!1,minFilter:Oe,magFilter:Oe,format:de,type:Ke})}const Ht=`
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;function z(a,e){return new Ve({vertexShader:Ht,fragmentShader:a,uniforms:{uTexel:{value:new q(1,1)},...e},depthTest:!1,depthWrite:!1})}const Wt=`
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
`,zt=`
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
  vec2 vel = texture2D(uVelocity, vUv).xy + force * ${fe};
  vec2 d = vUv - uPointer;
  d.x *= uAspect;
  vel += uPointerVel * uForce * ${fe} * exp(-dot(d, d) / uRadius);
  gl_FragColor = vec4(clamp(vel, vec2(-2000.0), vec2(2000.0)), 0.0, 1.0);
}
`,Qt=`
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
`,Zt=`
uniform sampler2D uSource;
uniform float uScale;
varying vec2 vUv;
void main() { gl_FragColor = texture2D(uSource, vUv) * uScale; }
`,Xt=`
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
`,Kt=`
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
`,Jt=`
uniform sampler2D uVelocity;
uniform vec2 uTexel;
uniform float uDissipation;
varying vec2 vUv;
void main() {
  vec2 back = clamp(vUv - texture2D(uVelocity, vUv).xy * uTexel * ${fe}, 0.0, 1.0);
  gl_FragColor = vec4(texture2D(uVelocity, back).xy / (1.0 + uDissipation * ${fe}), 0.0, 1.0);
}
`;class Yt{constructor(e){m(this,"width",1);m(this,"height",1);m(this,"velocity",[X(),X()]);m(this,"pressure",[X(),X()]);m(this,"curl",X());m(this,"divergence",X());m(this,"curlPass",z(Wt,{uVelocity:{value:null}}));m(this,"forcesPass");m(this,"divergencePass",z(Qt,{uVelocity:{value:null}}));m(this,"fadePass",z(Zt,{uSource:{value:null},uScale:{value:.8}}));m(this,"pressurePass",z(Xt,{uPressure:{value:null},uDivergence:{value:null}}));m(this,"gradientPass",z(Kt,{uVelocity:{value:null},uPressure:{value:null}}));m(this,"advectPass");m(this,"scene",new Ct);m(this,"camera",new Ze(-1,1,1,-1,0,1));m(this,"quad");this.options=e,this.forcesPass=z(zt,{uVelocity:{value:null},uCurl:{value:null},uCurlStrength:{value:e.curl},uPointer:{value:new q(-1,-1)},uPointerVel:{value:new q},uAspect:{value:1},uRadius:{value:e.radius*e.radius},uForce:{value:e.force}}),this.advectPass=z(Jt,{uVelocity:{value:null},uDissipation:{value:e.dissipation}});const s=new Ae;s.setAttribute("position",new De([-1,-1,0,3,-1,0,-1,3,0],3)),this.quad=new Ie(s,this.curlPass),this.quad.frustumCulled=!1,this.scene.add(this.quad)}get texture(){return this.velocity[0].texture}setSize(e){const s=this.options.resolution,r=Math.max(1,Math.round(e>=1?s*e:s)),i=Math.max(1,Math.round(e>=1?s:s/e));if(!(r===this.width&&i===this.height)){this.width=r,this.height=i;for(const n of[...this.velocity,...this.pressure,this.curl,this.divergence])n.setSize(r,i);for(const n of[this.curlPass,this.forcesPass,this.divergencePass,this.pressurePass,this.gradientPass,this.advectPass])n.uniforms.uTexel.value.set(1/r,1/i);this.forcesPass.uniforms.uAspect.value=r/i}}draw(e,s,r){this.quad.material=s,e.setRenderTarget(r),e.render(this.scene,this.camera)}swap(e){const s=e[0];e[0]=e[1],e[1]=s}step(e,s,r){const i=this.velocity;this.curlPass.uniforms.uVelocity.value=i[0].texture,this.draw(e,this.curlPass,this.curl);const n=this.forcesPass.uniforms;n.uVelocity.value=i[0].texture,n.uCurl.value=this.curl.texture,n.uPointer.value.copy(s),n.uPointerVel.value.copy(r),this.draw(e,this.forcesPass,i[1]),this.swap(i),this.divergencePass.uniforms.uVelocity.value=i[0].texture,this.draw(e,this.divergencePass,this.divergence);const o=this.pressure;this.fadePass.uniforms.uSource.value=o[0].texture,this.draw(e,this.fadePass,o[1]),this.swap(o),this.pressurePass.uniforms.uDivergence.value=this.divergence.texture;for(let l=0;l<this.options.iterations;l++)this.pressurePass.uniforms.uPressure.value=o[0].texture,this.draw(e,this.pressurePass,o[1]),this.swap(o);this.gradientPass.uniforms.uVelocity.value=i[0].texture,this.gradientPass.uniforms.uPressure.value=o[0].texture,this.draw(e,this.gradientPass,i[1]),this.swap(i),this.advectPass.uniforms.uVelocity.value=i[0].texture,this.draw(e,this.advectPass,i[1]),this.swap(i),e.setRenderTarget(null)}dispose(){for(const e of[...this.velocity,...this.pressure,this.curl,this.divergence])e.dispose();for(const e of[this.curlPass,this.forcesPass,this.divergencePass,this.fadePass,this.pressurePass,this.gradientPass,this.advectPass])e.dispose();this.quad.geometry.dispose()}}const es=new Ze(-1,1,1,-1,0,1);class ts extends Ae{constructor(){super(),this.setAttribute("position",new De([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new De([0,2,0,0,2,0],2))}}const ss=new ts;class rs{constructor(e){this._mesh=new Ie(ss,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,es)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class as{constructor(e,s,r){this.variables=[],this.currentTextureIndex=0;let i=pe;const n={passThruTexture:{value:null}},o=c(S(),n),l=new rs(o);this.setDataType=function(p){return i=p,this},this.addVariable=function(p,t,h){const x=this.createShaderMaterial(t),f={name:p,initialValueTexture:h,material:x,dependencies:null,renderTargets:[],wrapS:null,wrapT:null,minFilter:ie,magFilter:ie};return this.variables.push(f),f},this.setVariableDependencies=function(p,t){p.dependencies=t},this.init=function(){if(r.capabilities.maxVertexTextures===0)return"No support for vertex shader textures.";for(let p=0;p<this.variables.length;p++){const t=this.variables[p];t.renderTargets[0]=this.createRenderTarget(e,s,t.wrapS,t.wrapT,t.minFilter,t.magFilter),t.renderTargets[1]=this.createRenderTarget(e,s,t.wrapS,t.wrapT,t.minFilter,t.magFilter),this.renderTexture(t.initialValueTexture,t.renderTargets[0]),this.renderTexture(t.initialValueTexture,t.renderTargets[1]);const h=t.material,x=h.uniforms;if(t.dependencies!==null)for(let f=0;f<t.dependencies.length;f++){const b=t.dependencies[f];if(b.name!==t.name){let P=!1;for(let y=0;y<this.variables.length;y++)if(b.name===this.variables[y].name){P=!0;break}if(!P)return"Variable dependency not found. Variable="+t.name+", dependency="+b.name}x[b.name]={value:null},h.fragmentShader=`
uniform sampler2D `+b.name+`;
`+h.fragmentShader}}return this.currentTextureIndex=0,null},this.compute=function(){const p=this.currentTextureIndex,t=this.currentTextureIndex===0?1:0;for(let h=0,x=this.variables.length;h<x;h++){const f=this.variables[h];if(f.dependencies!==null){const b=f.material.uniforms;for(let P=0,y=f.dependencies.length;P<y;P++){const w=f.dependencies[P];b[w.name].value=w.renderTargets[p].texture}}this.doRenderTarget(f.material,f.renderTargets[t])}this.currentTextureIndex=t},this.getCurrentRenderTarget=function(p){return p.renderTargets[this.currentTextureIndex]},this.getAlternateRenderTarget=function(p){return p.renderTargets[this.currentTextureIndex===0?1:0]},this.dispose=function(){l.dispose();const p=this.variables;for(let t=0;t<p.length;t++){const h=p[t];h.initialValueTexture&&h.initialValueTexture.dispose();const x=h.renderTargets;for(let f=0;f<x.length;f++)x[f].dispose()}};function u(p){p.defines.resolution="vec2( "+e.toFixed(1)+", "+s.toFixed(1)+" )"}this.addResolutionDefine=u;function c(p,t){t=t||{};const h=new Ve({name:"GPUComputationShader",uniforms:t,vertexShader:d(),fragmentShader:p});return u(h),h}this.createShaderMaterial=c,this.createRenderTarget=function(p,t,h,x,f,b){return p=p||e,t=t||s,h=h||Ge,x=x||Ge,f=f||ie,b=b||ie,new Xe(p,t,{wrapS:h,wrapT:x,minFilter:f,magFilter:b,format:de,type:i,depthBuffer:!1})},this.createTexture=function(){const p=new Float32Array(e*s*4),t=new Je(p,e,s,de,pe);return t.needsUpdate=!0,t},this.renderTexture=function(p,t){n.passThruTexture.value=p,this.doRenderTarget(o,t),n.passThruTexture.value=null},this.doRenderTarget=function(p,t){const h=r.getRenderTarget(),x=r.xr.enabled,f=r.shadowMap.autoUpdate;r.xr.enabled=!1,r.shadowMap.autoUpdate=!1,l.material=p,r.setRenderTarget(t),l.render(r),l.material=o,r.xr.enabled=x,r.shadowMap.autoUpdate=f,r.setRenderTarget(h)};function d(){return`void main()	{

	gl_Position = vec4( position, 1.0 );

}
`}function S(){return`uniform sampler2D passThruTexture;

void main() {

	vec2 uv = gl_FragCoord.xy / resolution.xy;

	gl_FragColor = texture2D( passThruTexture, uv );

}
`}}}const ae=.12,ns=.32,tt=`
uvec3 pcg3d(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
vec3 rand3(uvec3 v) { return vec3(pcg3d(v)) * (1.0 / 4294967295.0); }

/* a particle's place in the cloud: a Gaussian spread round the pointer, turning, faster near the middle */
vec3 place(ivec2 ij, float time) {
  vec3 h = rand3(uvec3(uvec2(ij), 3u));
  float r = sqrt(-2.0 * log(max(h.x, 1e-6))) * ${ae};
  float a = h.y * 6.2831853 + time * ${ns} / (0.35 + r / ${ae});
  return vec3(cos(a) * r, sin(a) * r, r);
}
`,os=`
uniform sampler2D uFluid;
uniform float uFluidScale;
uniform float uAspect;
uniform vec2 uPointer;
uniform float uTime;
uniform float uDt;
uniform float uMerge;
uniform int uReps;
uniform int uSideI;
${tt}
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 P = texelFetch(texturePos, ij, 0);
  vec4 V = texelFetch(textureVel, ij, 0);
  vec2 home = uPointer + place(ij, uTime).xy;
  if (uMerge > 0.0) {
    // gathering onto the representatives
    int rep = (ij.y * uSideI + ij.x) % uReps;
    vec2 onto = texelFetch(texturePos, ivec2(rep % uSideI, rep / uSideI), 0).xy;
    home = mix(home, onto, uMerge);
  }
  // the fluid where the particle is, in screen heights per second
  vec2 fluid = texture2D(uFluid, vec2(P.x / uAspect, P.y)).xy * uFluidScale;
  vec2 v = V.xy;
  float pull = mix(3.2, 60.0, uMerge);
  v += ((home - P.xy) * pull + (fluid - v) * 7.0 * (1.0 - uMerge)) * uDt;
  v *= exp(-mix(0.9, 12.0, uMerge) * uDt);
  gl_FragColor = vec4(v, 0.0, 0.0);
}
`,is=`
uniform float uDt;
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 P = texelFetch(texturePos, ij, 0);
  vec4 V = texelFetch(textureVel, ij, 0);
  gl_FragColor = vec4(P.xy + V.xy * uDt, 0.0, 1.0);
}
`,ls=`
uniform sampler2D uReps;
uniform int uCount;
uniform int uSideI;
void main() {
  ivec2 ij = ivec2(gl_FragCoord.xy);
  int rep = (ij.y * uSideI + ij.x) % uCount;
  gl_FragColor = vec4(texelFetch(uReps, ivec2(rep % uSideI, rep / uSideI), 0).xy, 0.0, 1.0);
}
`,cs="void main() { gl_FragColor = vec4(0.0); }",us=`
uniform sampler2D uPos;
uniform sampler2D uVel;
uniform int uSide;
uniform float uAspect;
uniform float uSize;
uniform float uTime;
varying vec3 vColor;
${tt}
void main() {
  ivec2 ij = ivec2(gl_VertexID % uSide, gl_VertexID / uSide);
  vec2 p = texelFetch(uPos, ij, 0).xy;
  vec2 v = texelFetch(uVel, ij, 0).xy;
  gl_Position = vec4(p.x / uAspect * 2.0 - 1.0, p.y * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uSize;
  // waves of orange-red running out through the yellow, and redder the faster a particle goes
  float r = place(ij, 0.0).z / ${ae};
  float seed = rand3(uvec3(uvec2(ij), 5u)).x;
  float wave = 0.5 + 0.5 * sin(uTime * 1.4 - r * 2.8 + seed * 0.9);
  float speed = length(v) / ${ae};
  float mixing = clamp(wave * 0.7 + smoothstep(0.6, 5.0, speed) * 0.7, 0.0, 1.0);
  vColor = mix(vec3(0.992, 0.851, 0.0), vec3(1.0, 0.29, 0.11), mixing);
}
`,hs=`
varying vec3 vColor;
void main() { gl_FragColor = vec4(vColor, 1.0); }
`;class ds{constructor(e,s,r){m(this,"side");m(this,"count");m(this,"points");m(this,"float");m(this,"gpu");m(this,"pos");m(this,"vel");m(this,"material");m(this,"seedPass");m(this,"zeroPass");m(this,"reps",null);m(this,"repCount",1);this.side=s,this.count=s*s,this.gpu=new as(s,s,e),this.float=e.extensions.has("EXT_color_buffer_float"),this.gpu.setDataType(this.float?pe:Ke);const i=this.gpu.createTexture(),n=i.image.data;for(let c=0;c<this.count;c++)n[c*4]=Math.random()*r,n[c*4+1]=Math.random();const o=this.gpu.createTexture();this.pos=this.gpu.addVariable("texturePos",is,i),this.vel=this.gpu.addVariable("textureVel",os,o),this.gpu.setVariableDependencies(this.pos,[this.pos,this.vel]),this.gpu.setVariableDependencies(this.vel,[this.pos,this.vel]),Object.assign(this.pos.material.uniforms,{uDt:{value:0}}),Object.assign(this.vel.material.uniforms,{uFluid:{value:null},uFluidScale:{value:1},uAspect:{value:r},uPointer:{value:new q(r/2,.5)},uTime:{value:0},uDt:{value:0},uMerge:{value:0},uReps:{value:1},uSideI:{value:s}});const l=this.gpu.init();if(l)throw new Error(l);i.dispose(),o.dispose(),this.seedPass=this.gpu.createShaderMaterial(ls,{uReps:{value:null},uCount:{value:1},uSideI:{value:s}}),this.zeroPass=this.gpu.createShaderMaterial(cs,{});const u=new Ae;u.setAttribute("position",new It(new Uint8Array(this.count),1)),u.boundingSphere=new Qe(new V,1e4),this.material=new Ve({vertexShader:us,fragmentShader:hs,uniforms:{uPos:{value:null},uVel:{value:null},uSide:{value:s},uAspect:{value:r},uSize:{value:2},uTime:{value:0}},depthTest:!1,depthWrite:!1,blending:At}),this.points=new Vt(u,this.material),this.points.frustumCulled=!1,this.points.renderOrder=10}seed(e,s){var o;const r=Math.ceil(s/this.side);(!this.reps||this.reps.image.height!==r)&&((o=this.reps)==null||o.dispose(),this.reps=new Je(new Float32Array(this.side*r*4),this.side,r,de,pe));const i=this.reps.image.data;for(let l=0;l<s;l++)i[l*4]=e[l*2],i[l*4+1]=e[l*2+1];this.reps.needsUpdate=!0,this.repCount=s;const n=this.seedPass.uniforms;n.uReps.value=this.reps,n.uCount.value=s;for(const l of[this.gpu.getCurrentRenderTarget(this.pos),this.gpu.getAlternateRenderTarget(this.pos)])this.gpu.doRenderTarget(this.seedPass,l);for(const l of[this.gpu.getCurrentRenderTarget(this.vel),this.gpu.getAlternateRenderTarget(this.vel)])this.gpu.doRenderTarget(this.zeroPass,l);this.vel.material.uniforms.uReps.value=s}read(e,s,r){const i=Math.ceil(s/this.side),n=new Float32Array(this.side*i*4);e.readRenderTargetPixels(this.gpu.getCurrentRenderTarget(this.pos),0,0,this.side,i,n);for(let o=0;o<s;o++)r[o*2]=n[o*4],r[o*2+1]=n[o*4+1]}step({dt:e,time:s,aspect:r,pointer:i,fluid:n,fluidScale:o,size:l,merge:u}){this.pos.material.uniforms.uDt.value=e;const c=this.vel.material.uniforms;c.uFluid.value=n,c.uFluidScale.value=o,c.uAspect.value=r,c.uPointer.value.copy(i),c.uTime.value=s,c.uDt.value=e,c.uMerge.value=u,c.uReps.value=this.repCount,this.gpu.compute();const d=this.material.uniforms;d.uPos.value=this.gpu.getCurrentRenderTarget(this.pos).texture,d.uVel.value=this.gpu.getCurrentRenderTarget(this.vel).texture,d.uAspect.value=r,d.uTime.value=s,d.uSize.value=l}dispose(){var e;this.gpu.dispose(),(e=this.reps)==null||e.dispose(),this.seedPass.dispose(),this.zeroPass.dispose(),this.points.geometry.dispose(),this.material.dispose()}}function ps(){const a=new _t({flatShading:!0,roughness:.6,metalness:0,toneMapped:!1}),e={shape:new Z(1,0,0,0),flat:{value:0}};return a.onBeforeCompile=s=>{s.uniforms.uShape={value:e.shape},s.uniforms.uFlat=e.flat,s.vertexShader=s.vertexShader.replace("#include <common>",`#include <common>
        uniform vec4 uShape;
        vec3 shapeOf(vec3 p) {
          vec3 dir = normalize(p);
          vec3 gem = dir / (abs(dir.x) + abs(dir.y) + abs(dir.z)) * 0.62;
          vec3 tile = vec3(p.xy, p.z * 0.02);
          return p * uShape.x + gem * uShape.y + dir * 0.5 * uShape.z + tile * uShape.w;
        }`).replace("#include <begin_vertex>","vec3 transformed = shapeOf(vec3(position));"),s.fragmentShader=s.fragmentShader.replace("#include <common>",`#include <common>
uniform float uFlat;`).replace("#include <opaque_fragment>",`outgoingLight = mix(outgoingLight, diffuseColor.rgb, uFlat);
#include <opaque_fragment>`)},a.customProgramCacheKey=()=>"better-r3f-morph",Object.assign(a,{morph:e})}function fs(a){return new jt(1,1,1,a,a,a)}function Re(a,e,s,r=[0,0,0]){return a=Math.imul(a,1664525)+1013904223>>>0,e=Math.imul(e,1664525)+1013904223>>>0,s=Math.imul(s,1664525)+1013904223>>>0,a=a+Math.imul(e,s)>>>0,e=e+Math.imul(s,a)>>>0,s=s+Math.imul(a,e)>>>0,a=(a^a>>>16)>>>0,e=(e^e>>>16)>>>0,s=(s^s>>>16)>>>0,a=a+Math.imul(e,s)>>>0,e=e+Math.imul(s,a)>>>0,s=s+Math.imul(a,e)>>>0,r[0]=a/4294967295,r[1]=e/4294967295,r[2]=s/4294967295,r}function ms(a){let e=a>>>0;return()=>(e=Math.imul(e,1664525)+1013904223>>>0,e/4294967296)}function Pe(a){const e=new Float32Array(a*4);for(let s=0;s<a;s++)e[s*4+3]=1;return{n:a,pos:new Float32Array(a*3),rot:e,scale:new Float32Array(a*3).fill(1),color:new Float32Array(a*3).fill(1)}}function vs(a,e){e.pos.set(a.pos),e.rot.set(a.rot),e.scale.set(a.scale),e.color.set(a.color)}const Fe=()=>({position:new V,quaternion:new ge,fov:50}),me=new ve,Ne=new ge,He=new Ut,K=new V,gs=new $,st=new V(0,1,0);function xe(a,e,s,r,i,n,o,l){return a.position.set(e,s,r),me.lookAt(a.position,K.set(i,n,o),st),a.quaternion.setFromRotationMatrix(me),a.fov=l,a}const ye=(a,e,s)=>{a.color[e*3]=s.r,a.color[e*3+1]=s.g,a.color[e*3+2]=s.b};function xs(a){const e=Math.round(Math.sqrt(a)),s=1.3,r=Array.from({length:a},(o,l)=>{const u=(l%e-(e-1)/2)*s,c=(Math.floor(l/e)-(e-1)/2)*s,d=Math.hypot(u,c);return{x:u,z:c,distance:d,color:We(d/(e*s*.7)).clone()}}),i=(o,l)=>{for(let u=0;u<a;u++){const c=r[u],d=Math.sin(c.distance*.32-l*2.4);o.pos[u*3]=c.x,o.pos[u*3+1]=d*1.3,o.pos[u*3+2]=c.z,o.scale[u*3]=1,o.scale[u*3+1]=1.6+d,o.scale[u*3+2]=1,o.rot.fill(0,u*4,u*4+3),o.rot[u*4+3]=1,ye(o,u,c.color)}},n=new ge().setFromAxisAngle(st,.13);return{id:"instancing",shape:new Z(1,0,0,0),flat:0,camera(o,l,u){const c=e*.7;return xe(u,Math.sin(o*.1)*c,e*.46,Math.cos(o*.1)*c,0,-4,0,35),u.quaternion.multiply(n),u},start:o=>i(o,0),update:(o,l)=>i(o,l)}}function ys(a,e){const r=Math.PI*(3-Math.sqrt(5)),i=Array.from({length:e},(o,l)=>{const u=1-l/(e-1)*2,c=Math.sqrt(1-u*u),d=r*l;return{base:new V(Math.cos(d)*c*9.5,u*9.5,Math.sin(d)*c*9.5),color:We((1-u)/2).clone(),speed:.6+l*7919%100/100}}),n=(o,l,u)=>{me.makeRotationFromEuler(He.set(.35,l*.15,.12));for(let c=0;c<a;c++){const d=c%e;K.copy(i[d].base).applyMatrix4(me),o.pos[c*3]=K.x+4.6,o.pos[c*3+1]=K.y,o.pos[c*3+2]=K.z;const S=c<e?1:0;if(o.scale.fill(S,c*3,c*3+3),u){const p=l*i[d].speed;Ne.setFromEuler(He.set(p,p*.7,0)),Ne.toArray(o.rot,c*4)}ye(o,c,i[d].color)}};return{id:"rerenders",shape:new Z(0,1,0,0),flat:0,camera:(o,l,u)=>xe(u,0,0,27,0,0,0,50),start:o=>n(o,0,!0),update:(o,l,u,c)=>n(o,l,c.mode==="better")}}const Ce={perFrame:0};function ws(a){const s=[{color:new $(ce.yellow),phase:0},{color:new $(ce.pink),phase:2.1},{color:new $(ce.blue),phase:4.2}],r=(c,d)=>2.4+Math.sin(c*.55+s[d].phase)*4.4,i=(c,d)=>Math.sin(c*.8+s[d].phase*1.7)*2.3,n=(c,d)=>Math.cos(c*.55+s[d].phase)*3.4,o=ms(7),l=Array.from({length:a},(c,d)=>{const S=o()*2-1,p=o()*Math.PI*2,t=Math.sqrt(1-S*S),h=new V(Math.cos(p)*t,S,Math.sin(p)*t).multiplyScalar(2+o()*6);h.x+=2.4;const x=new V(o()*2-1,o()*2-1,o()*2-1).normalize();return x.multiplyScalar(.4+o()*1.6),{start:h,position:h.clone(),velocity:new V,offset:x,speed:.05+o()*.07,group:d%s.length}}),u=c=>{for(let d=0;d<a;d++){const S=l[d];S.position.toArray(c.pos,d*3),c.scale.fill(.11,d*3,d*3+3),c.rot.fill(0,d*4,d*4+3),c.rot[d*4+3]=1,ye(c,d,s[S.group].color)}};return{id:"pool",shape:new Z(0,0,1,0),flat:.65,camera:(c,d,S)=>xe(S,0,2.5,15,0,0,0,50),start(c){for(const d of l)d.position.copy(d.start),d.velocity.set(0,0,0);u(c)},update(c,d,S,p){if(p.mode==="classic"){for(let t=0;t<a;t++){const{position:h,velocity:x,offset:f,speed:b,group:P}=l[t],y=new V(r(d,P),i(d,P),n(d,P)).add(f),w=new V().subVectors(y,h).setLength(b),g=new V().subVectors(w,x).clampLength(0,.004),_=new V(-f.z,0,f.x).setLength(.004*.5);x.add(g).add(_).clampLength(0,b),h.add(x)}Ce.perFrame=a*4}else{const t=p.pool,h=t.stats.created;for(let x=0;x<a;x++){const{position:f,velocity:b,offset:P,speed:y,group:w}=l[x],g=t.vector3(r(d,w),i(d,w),n(d,w)).add(P),_=t.vector3().subVectors(g,f).setLength(y),U=t.vector3().subVectors(_,b).clampLength(0,.004),L=t.vector3(-P.z,0,P.x).setLength(.004*.5);b.add(U).add(L).clampLength(0,y),f.add(b)}Ce.perFrame=t.stats.created-h}u(c)}}}const rt=50,at=15,Y=2*at*Math.tan(J.degToRad(rt/2)),Ue=2;new $(ce.yellow);new $("#ff4a1c");const ee=[0,0,0];function Ts(a,e,s,r){Re(a%e,Math.floor(a/e),3,ee);const i=Math.sqrt(-2*Math.log(Math.max(ee[0],1e-6)))*ae,n=ee[1]*Math.PI*2;return r.set(s.x+Math.cos(n)*i,s.y+Math.sin(n)*i)}function nt(a,e,s,r){const i=a%e,n=Math.floor(a/e);Re(i,n,3,ee);const o=Math.sqrt(-2*Math.log(Math.max(ee[0],1e-6))),l=Re(i,n,5,ee)[0],u=.5+.5*Math.sin(s*1.4-o*2.8+l*.9);return r.setRGB(J.lerp(.992,1,u*.7),J.lerp(.851,.29,u*.7),J.lerp(0,.11,u*.7),Et),r}const ot=(a,e,s)=>a+e*Math.floor((s-1-a)/e);function it(a,e,s,r){return r.set((a-s/2)*Y,(e-.5)*Y,0)}function bs(a){const e=new q;return{id:"fluid",shape:new Z(0,0,0,1),flat:1,camera:(s,r,i)=>xe(i,0,0,at,0,0,0,rt),start(s,r){const i=Ue/r.height*Y;for(let n=0;n<a;n++)Ts(n,r.fluidSide,r.center,e),it(e.x,e.y,r.aspect,K).toArray(s.pos,n*3),s.scale[n*3]=i,s.scale[n*3+1]=i,s.scale[n*3+2]=i,s.rot.fill(0,n*4,n*4+3),s.rot[n*4+3]=1,ye(s,n,nt(ot(n,a,r.fluidCount),r.fluidSide,0,gs))},update(){}}}const Ms={BetterFluid:"fluid",BetterInstancing:"instancing",BetterRerenders:"rerenders",BetterPool:"pool"},Se=["fluid","instancing","rerenders","pool"],Ps={fluid:"BetterFluid",instancing:"BetterInstancing",rerenders:"BetterRerenders",pool:"BetterPool"},te=typeof matchMedia<"u"&&matchMedia("(pointer: coarse)").matches,M=te?2500:1e4,he=te?700:1600,Q=te?256:1024,lt={count:0};function ct(a,e,s,r){const i=new Float32Array(257),n=(l,u,c)=>3*u*l*(1-l)**2+3*c*l*l*(1-l)+l**3;let o=0;for(let l=0;l<=256;l++){const u=l/256;for(;o<1&&n(o,a,s)<u;)o+=1/4096;i[l]=n(o,e,r)}return l=>{const u=Math.min(Math.max(l,0),1)*256,c=Math.floor(u);return c>=256?i[256]:i[c]+(i[c+1]-i[c])*(u-c)}}const Fs=ct(.45,0,.1,1),Ss=ct(.65,0,.1,1),E={x:0,y:0,seen:!1,at:0,out:!1};function Ds(){const a=s=>{E.x=s.clientX,E.y=s.clientY,E.seen=!0,E.out=!1,E.at=performance.now()},e=s=>{s.relatedTarget||(E.out=!0)};return addEventListener("pointermove",a,{passive:!0}),addEventListener("pointerdown",a,{passive:!0}),document.documentElement.addEventListener("pointerleave",e),()=>{removeEventListener("pointermove",a),removeEventListener("pointerdown",a),document.documentElement.removeEventListener("pointerleave",e)}}class Rs{constructor(e,s){m(this,"sim",new Yt({resolution:te?112:160,curl:22,force:3200,radius:.05,dissipation:1.2,iterations:20}));m(this,"flow");m(this,"time",0);m(this,"at",new q(-1,-1));m(this,"last",new q);m(this,"uv",new q);m(this,"push",new q);m(this,"speed",new q);this.flow=new ds(e,s,1.6)}step(e,s,r,i,n,o){this.sim.setSize(r),this.at.x<0&&this.last.copy(n),this.at.copy(n),this.speed.lerp(this.push.subVectors(this.at,this.last).divideScalar(Math.max(s,1e-4)),.35),this.speed.multiplyScalar(Math.exp(-6*s)),this.last.copy(this.at),this.uv.set(this.at.x/r,this.at.y),this.push.set(this.speed.x/r,this.speed.y),this.sim.step(e,this.uv,o>0?this.push.set(0,0):this.push),this.flow.step({dt:s,time:this.time,aspect:r,pointer:this.at,fluid:this.sim.texture,fluidScale:1/this.sim.height,size:Ue*e.getPixelRatio(),merge:o}),this.time+=s}dispose(){this.sim.dispose(),this.flow.dispose()}}function ut({index:a,speed:e,proxies:s}){lt.count++;const[r,i]=C.useState(0);return _e((n,o)=>i(l=>l+o*e)),v.jsx(je,{ref:n=>void(s.current[a]=n),rotation:[r,r*.7,0]})}ut.displayName="StateGem";function Cs({layout:a}){const e=C.useRef([]),s=C.useMemo(()=>Array.from({length:M},(r,i)=>`#${new $().fromArray(a.color,i*3).getHexString()}`),[a]);return _e(()=>{for(let r=0;r<M;r++){const i=e.current[r];i&&(i.position.fromArray(a.pos,r*3),i.scale.fromArray(a.scale,r*3))}}),v.jsx(v.Fragment,{children:s.map((r,i)=>v.jsxs("mesh",{ref:n=>void(e.current[i]=n),children:[v.jsx("boxGeometry",{}),v.jsx("meshStandardMaterial",{color:r,flatShading:!0,roughness:.6,toneMapped:!1})]},i))})}function Is({target:a,modes:e}){const s=Ot(P=>P.gl),r=C.useMemo(()=>({fluid:bs(M),instancing:xs(M),rerenders:ys(M,he),pool:ws(M)}),[]),i=ue(()=>fs(te?1:2),[]),n=ue(()=>ps(),[]),o=ue(()=>new Rs(s,Q),[s]),l=C.useRef(new Array(M).fill(null)),u=C.useRef(null),[c,d]=C.useState(null),S=C.useRef(a);S.current=a;const p=C.useRef(e);p.current=e;const t=C.useMemo(()=>({cur:Pe(M),from:Pe(M),to:Pe(M),delay:new Float32Array(M),arc:new Float32Array(M),xy:new Float32Array(M*2),phase:"start",formation:null,next:null,t:0,phaseAt:0,camFrom:Fe(),camTo:Fe(),cam:Fe(),shapeFrom:new Z,shapeTo:new Z,flatFrom:0,flatTo:0,fluidOn:!1,center:new q,probe:new Lt}),[]),h=C.useMemo(()=>({n:M,aspect:1,height:1,mode:"better",pool:null,center:t.center,fluidCount:Q**2,fluidSide:Q}),[t]);C.useEffect(()=>Ds(),[]);const x=c==="rerenders"&&e.rerenders==="classic",f=c==="instancing"&&e.instancing==="classic",b=C.useMemo(()=>{const P=y=>.6+y*7919%100/100;return Array.from({length:M},(y,w)=>x&&w<he?v.jsx(ut,{index:w,speed:P(w),proxies:l},`gem${w}`):v.jsx(je,{ref:g=>void(l.current[w]=g)},w))},[x]);return _e((P,y)=>{const w=P.clock.elapsedTime,g=Math.min(y,1/30),{size:_,camera:U,pool:L}=P;h.aspect=_.width/_.height,h.height=_.height,h.pool=L;const N=s.domElement.getBoundingClientRect();E.seen&&!E.out&&performance.now()-E.at<(te?2600:1e9)?t.center.set((E.x-N.left)/N.height,1-(E.y-N.top)/N.height):t.center.set(h.aspect*.6+Math.sin(w*.37)*.22*h.aspect*.4,.5+Math.sin(w*.51)*.18);const I=r[S.current],ht=T=>p.current[T],we=T=>{vs(t.cur,t.from),h.mode="better",T.start(t.to,h),T.camera(0,h,t.camTo),t.camFrom.position.copy(U.position),t.camFrom.quaternion.copy(U.quaternion),t.camFrom.fov=U.fov;const D=t.probe;D.fov=t.camTo.fov,D.aspect=h.aspect,D.position.copy(t.camTo.position),D.quaternion.copy(t.camTo.quaternion),D.updateMatrixWorld(),D.updateProjectionMatrix();const O=L.vector3();for(let R=0;R<M;R++){O.fromArray(t.to.pos,R*3).project(D);const F=(R*2654435761>>>0)/4294967296;t.delay[R]=.5*J.clamp((O.x+1)/2,0,1)+.1*F;const G=O.fromArray(t.to.pos,R*3).distanceTo(L.vector3().fromArray(t.from.pos,R*3));t.arc[R]=Math.min(G*.16,3)*(.5+F)}t.shapeFrom.copy(n.morph.shape),t.flatFrom=n.morph.flat.value,t.shapeTo.copy(T.shape),t.flatTo=T.flat,t.next=T,t.phase="morph",t.phaseAt=w,d(null)},Ee=T=>{if(t.formation=T,t.phase="run",t.t=0,n.morph.shape.copy(T.shape),n.morph.flat.value=T.flat,T.id==="fluid"){for(let D=0;D<M;D++)t.xy[D*2]=t.cur.pos[D*3]/Y+h.aspect/2,t.xy[D*2+1]=t.cur.pos[D*3+1]/Y+.5;o.flow.seed(t.xy,M),o.time=0,t.fluidOn=!0}d(T.id)};if(t.phase==="start"?(I.start(t.cur,h),I.camera(0,h,t.cam),Ee(I)):t.phase==="run"&&I!==t.formation&&(t.formation.id==="fluid"?(t.phase="merge",t.phaseAt=w):we(I)),t.phase==="merge"){const T=Math.min((w-t.phaseAt)/.45,1);if(o.step(s,g,h.aspect,h.height,t.center,T*T*(3-2*T)),T>=1){o.flow.read(s,M,t.xy);const D=Ue/h.height*Y,O=new $,R=new V;for(let F=0;F<M;F++)it(t.xy[F*2],t.xy[F*2+1],h.aspect,R).toArray(t.cur.pos,F*3),t.cur.scale.fill(D,F*3,F*3+3),t.cur.rot.fill(0,F*4,F*4+3),t.cur.rot[F*4+3]=1,nt(ot(F,M,Q**2),Q,o.time,O).toArray(t.cur.color,F*3);t.fluidOn=!1,we(I)}}let Te=!1;if(t.phase==="morph"){I!==t.next&&we(I);const T=w-t.phaseAt,D=1.15,O=.6+D,{from:R,to:F,cur:G}=t;for(let B=0;B<M;B++){const se=Fs((T-t.delay[B])/D),dt=Math.sin(Math.PI*se)*t.arc[B];for(let be=0;be<3;be++){const j=B*3+be;G.pos[j]=R.pos[j]+(F.pos[j]-R.pos[j])*se,G.scale[j]=R.scale[j]+(F.scale[j]-R.scale[j])*se,G.color[j]=R.color[j]+(F.color[j]-R.color[j])*se}G.pos[B*3+1]+=dt,ge.slerpFlat(G.rot,B*4,R.rot,B*4,F.rot,B*4,se)}Te=!0;const A=Ss(T/O);t.cam.position.lerpVectors(t.camFrom.position,t.camTo.position,A),t.cam.quaternion.slerpQuaternions(t.camFrom.quaternion,t.camTo.quaternion,A),t.cam.fov=t.camFrom.fov+(t.camTo.fov-t.camFrom.fov)*A;const k=J.smoothstep(A,.15,.85);n.morph.shape.lerpVectors(t.shapeFrom,t.shapeTo,k),n.morph.flat.value=t.flatFrom+(t.flatTo-t.flatFrom)*k,T>=O&&Ee(t.next)}if(t.phase==="run"){const T=t.formation;h.mode=ht(T.id),T.id==="fluid"?o.step(s,g,h.aspect,h.height,t.center,0):T.update(t.cur,t.t,g,h),Te=T.id==="rerenders",T.camera(t.t,h,t.cam),t.t+=g}const W=U;if(W.position.copy(t.cam.position),W.quaternion.copy(t.cam.quaternion),(W.fov!==t.cam.fov||W.aspect!==h.aspect)&&(W.fov=t.cam.fov,W.aspect=h.aspect,W.updateProjectionMatrix()),o.flow.points.visible=t.fluidOn,u.current&&(u.current.visible=!t.fluidOn&&!(f&&t.phase==="run")),!t.fluidOn){const T=x&&t.phase==="run"?he:0,{pos:D,rot:O,scale:R,color:F}=t.cur,G=l.current;for(let A=0;A<M;A++){const k=G[A];k&&(k.position.fromArray(D,A*3),k.scale.fromArray(R,A*3),k.color.fromArray(F,A*3),Te&&A>=T&&k.quaternion.fromArray(O,A*4))}}}),v.jsxs(v.Fragment,{children:[v.jsx("hemisphereLight",{args:["#fff6e0","#1d1d24",1.6]}),v.jsx("directionalLight",{position:[20,40,10],intensity:2.2}),v.jsx(et,{ref:u,limit:M,geometry:i,material:n,frustumCulled:!1,children:b}),f&&v.jsx(Cs,{layout:t.cur}),v.jsx("primitive",{object:o.flow.points})]})}const As=Pt(()=>lt.count),Vs={fluid:{title:`Fluid: ${re(Q**2)} particles`,description:v.jsx(v.Fragment,{children:"Move the pointer: it pushes a fluid simulated on the graphics card, and a million squares drift with it — swept into eddies, then gathered round the pointer again. Every square is the same; only its colour moves."}),labels:{classic:"dpr={[1, 2]}",better:"adaptiveDpr"},metrics:[{label:"Frames a second",read:ne,graph:{max:60}},{label:"Pixel ratio",read:Tt,format:oe(2),graph:{min:.5,max:2}},{label:"Time a frame",read:qe,format:oe(1),unit:"ms"},{label:"Particles",read:()=>Q**2}]},instancing:{title:`Instancing: ${re(M)} cubes`,description:v.jsxs(v.Fragment,{children:["One ",v.jsx("code",{children:"<mesh>"})," per cube is a draw call per cube. ",v.jsx("code",{children:"<Instances>"})," draws them all in one, and uploads only the cubes that moved."]}),labels:{classic:`<mesh> ×${re(M)}`,better:"<Instances>"},metrics:[{label:"Frames a second",read:ne,graph:{max:60}},{label:"Time a frame",read:qe,format:oe(1),unit:"ms",graph:{max:16}},{label:"Draw calls",read:bt}],hints:/meshes use the same BoxGeometry/},rerenders:{title:`Re-renders: ${re(he)} spinning gems`,description:v.jsxs(v.Fragment,{children:["Setting state in ",v.jsx("code",{children:"useFrame"})," renders the component again 60 times a second; writing to a ref doesn’t render at all. better-r3f spots the first and says how to fix it."]}),labels:{classic:"useState",better:"useRef"},metrics:[{label:"Frames a second",read:ne,graph:{max:60}},{label:"Renders a second",read:As}],hints:/got new rotation from React/},pool:{title:`Frame pool: ${re(M)} steering particles`,description:v.jsxs(v.Fragment,{children:["Four temporary vectors per particle per frame. Made with ",v.jsx("code",{children:"new"}),", they’re garbage the moment the frame ends; ",v.jsx("code",{children:"state.pool"})," hands the same ones out again on the next."]}),labels:{classic:"new Vector3()",better:"pool.vector3()"},metrics:[{label:"Frames a second",read:ne,graph:{max:60}},{label:"New vectors",read:()=>Ce.perFrame,unit:"a frame"},{label:"Garbage",read:Mt,format:oe(1),unit:"MB/s",graph:{}}]}};function Gs({name:a}){const e=Ms[a]??"fluid",[,s]=mt(),[r,i]=C.useState(()=>{const l=Me.get("mode")==="classic"?"classic":"better";return{fluid:"better",instancing:"better",rerenders:"better",pool:"better",[e]:l}});vt(),C.useEffect(()=>{if(!Me.has("tour"))return;const o=Se[(Se.indexOf(e)+1)%Se.length],l=setTimeout(()=>s(`/demo/${Ps[o]}${location.search}`),Number(Me.get("tour"))||3400);return()=>clearTimeout(l)},[e,s]);const n=Vs[e];return v.jsxs(gt,{children:[v.jsxs(qt,{dpr:[1,2],adaptiveDpr:e==="fluid"&&r.fluid==="better"?{min:.75}:!1,gl:{antialias:!0,powerPreference:"high-performance"},camera:{fov:50,position:[0,0,15],near:.1,far:600},children:[v.jsx("color",{attach:"background",args:[xt]}),v.jsx(Is,{target:e,modes:r}),v.jsx(yt,{})]}),v.jsx(wt,{mode:r[e],setMode:o=>i(l=>({...l,[e]:o})),labels:n.labels,title:n.title,description:n.description,metrics:n.metrics,hints:n.hints})]})}export{Ms as PARTICLE_DEMOS,Gs as default,lt as renders};
