import * as THREE from 'three';

const frag = (model) => `
precision highp float;
uniform vec2 uRes;
uniform mat4 uProjInv;
uniform mat4 uCamWorld;
uniform mat4 uVP;
uniform float uMode;   // 0 stone, 1 skin, 2 x-ray
uniform float uQuality;
uniform float uFocusY; // region highlight (unused when < -1)
float smin(float a,float b,float k){ float h=max(k-abs(a-b),0.0)/k; return min(a,b)-h*h*k*0.25; }
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba=b-a; float l2=dot(ba,ba); float rr=r1-r2; float a2=l2-rr*rr; float il2=1.0/l2;
  vec3 pa=p-a; float y=dot(pa,ba); float z=y-l2; vec3 xv=pa*l2-ba*y; float x2=dot(xv,xv);
  float y2=y*y*l2; float z2=z*z*l2; float k=sign(rr)*rr*rr*x2;
  if(sign(z)*a2*z2>k) return sqrt(x2+z2)*il2-r2;
  if(sign(y)*a2*y2<k) return sqrt(x2+y2)*il2-r1;
  return (sqrt(x2*a2*il2)+y*rr)*il2-r1;
}
float sdEll0(vec3 q, vec3 r){ float k0=length(q/r); float k1=length(q/(r*r)); return k0*(k0-1.0)/k1; }
float sdEll(vec3 p, vec3 c, vec3 r){ return sdEll0(p-c,r); }
float sdOE(vec3 d, vec3 a0, vec3 a1, vec3 a2, vec3 r){ return sdEll0(vec3(dot(d,a0),dot(d,a1),dot(d,a2)),r); }
float sdOB(vec3 d, vec3 a0, vec3 a1, vec3 a2, vec3 b, float rr){ vec3 q=abs(vec3(dot(d,a0),dot(d,a1),dot(d,a2)))-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-rr; }
${model.glsl}
float softShadow(vec3 ro, vec3 rd){
  float res=1.0, t=0.006;
  for(int i=0;i<28;i++){ float h=map(ro+rd*t); res=min(res,10.0*h/t); t+=clamp(h,0.004,0.06); if(res<0.02||t>0.9) break; }
  return clamp(res,0.0,1.0);
}
vec3 calcNormal(vec3 p){
  const vec2 k=vec2(1.0,-1.0); const float h=0.0005;
  return normalize(k.xyy*map(p+k.xyy*h)+k.yyx*map(p+k.yyx*h)+k.yxy*map(p+k.yxy*h)+k.xxx*map(p+k.xxx*h));
}
float calcAO(vec3 p, vec3 n){
  float occ=0.0, sca=1.0;
  for(int i=0;i<5;i++){ float h=0.004+0.05*float(i)/4.0; float d=map(p+h*n); occ+=(h-d)*sca; sca*=0.85; }
  return clamp(1.0-7.0*occ,0.0,1.0);
}
bool boxHit(vec3 ro, vec3 rd, out float tn, out float tf){
  vec3 bmin=vec3(-0.78,-0.01,-0.2), bmax=vec3(0.78,1.78,0.2);
  vec3 inv=1.0/rd; vec3 t0=(bmin-ro)*inv; vec3 t1=(bmax-ro)*inv;
  vec3 tmin=min(t0,t1), tmax=max(t0,t1);
  tn=max(max(tmin.x,tmin.y),tmin.z); tf=min(min(tmax.x,tmax.y),tmax.z);
  return tf>max(tn,0.0);
}
void main(){
  vec2 ndc=gl_FragCoord.xy/uRes*2.0-1.0;
  vec4 pv=uProjInv*vec4(ndc,1.0,1.0); pv/=pv.w;
  vec3 rd=normalize((uCamWorld*vec4(pv.xyz,0.0)).xyz);
  vec3 ro=cameraPosition;
  float tn,tf;
  if(!boxHit(ro,rd,tn,tf)) discard;
  float t=max(tn,0.0); bool hit=false;
  for(int i=0;i<170;i++){
    vec3 p=ro+rd*t; float d=map(p);
    if(d<0.00012*t+0.00003){hit=true;break;}
    t+=d*0.95; if(t>tf) break;
  }
  if(!hit) discard;
  vec3 p=ro+rd*t; vec3 n=calcNormal(p);
  vec3 v=-rd;
  float ao=calcAO(p,n);
  float fres=pow(1.0-clamp(dot(n,v),0.0,1.0),3.0);
  vec3 L1=normalize(vec3(0.45,0.75,0.6)), L2=normalize(vec3(-0.7,0.25,0.35)), L3=normalize(vec3(0.0,0.4,-1.0));
  vec3 col; float alpha=1.0;
  float sh = (uMode<1.5 && uQuality>0.5) ? mix(0.35,1.0,softShadow(p+n*0.0015,L1)) : 1.0;
  if(uMode<0.5){
    vec3 base=vec3(0.60,0.62,0.66);
    float d1=max(dot(n,L1),0.0), d2=max(dot(n,L2),0.0), d3=max(dot(n,L3),0.0);
    float hemi=0.5+0.5*n.y;
    col=base*(0.22*hemi+0.85*d1*sh*vec3(1.0,0.97,0.92)+0.28*d2*vec3(0.75,0.82,1.0))*mix(0.55,1.0,ao);
    col+=vec3(0.55,0.65,0.85)*d3*0.35*ao;
    vec3 h=normalize(L1+v); col+=vec3(0.18)*pow(max(dot(n,h),0.0),40.0)*ao;
    col+=fres*vec3(0.25,0.3,0.4)*0.6;
  } else if(uMode<1.5){
    vec3 base=vec3(0.88,0.69,0.57);
    float w1=clamp((dot(n,L1)+0.35)/1.35,0.0,1.0)*mix(0.45,1.0,sh);
    float d2=max(dot(n,L2),0.0), d3=max(dot(n,L3),0.0);
    vec3 sss=vec3(0.95,0.35,0.25)*(1.0-w1)*0.18;
    float hemi=0.5+0.5*n.y;
    col=base*(0.25*hemi+0.8*w1*vec3(1.0,0.96,0.9)+0.22*d2*vec3(0.8,0.85,1.0))*mix(0.6,1.0,ao)+sss*ao;
    vec3 h=normalize(L1+v); col+=vec3(0.10)*pow(max(dot(n,h),0.0),24.0)*ao;
    col+=fres*vec3(0.35,0.3,0.3)*0.35+d3*vec3(0.3,0.25,0.25)*0.3;
  } else {
    col=mix(vec3(0.25,0.45,0.7),vec3(0.65,0.85,1.0),fres);
    alpha=0.10+0.55*fres;
  }
  col=pow(col,vec3(0.4545));
  vec4 clip=uVP*vec4(p,1.0);
  gl_FragDepth=(clip.z/clip.w)*0.5+0.5;
  gl_FragColor=vec4(col,alpha);
}`;

export function makeBody(model) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uProjInv: { value: new THREE.Matrix4() },
      uCamWorld: { value: new THREE.Matrix4() },
      uVP: { value: new THREE.Matrix4() },
      uMode: { value: 0 },
      uQuality: { value: 1 },
      uFocusY: { value: -2 },
    },
    vertexShader: 'void main(){ gl_Position=vec4(position.xy,0.0,1.0); }',
    fragmentShader: frag(model),
    transparent: true,
    depthTest: true,
    depthWrite: true,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  mesh.onBeforeRender = (renderer, scene, camera) => {
    mat.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
    mat.uniforms.uCamWorld.value.copy(camera.matrixWorld);
    mat.uniforms.uVP.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  };
  return { mesh, mat };
}
