export const voxelVertex = `
varying vec3 vColor; varying vec3 vNormal;
void main(){vColor=color;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const voxelFragment = `
uniform vec3 lightDirection; uniform float levels; uniform bool pixelArt;
varying vec3 vColor; varying vec3 vNormal;
void main(){
 float diffuse=max(dot(normalize(vNormal),normalize(lightDirection)),0.);
 vec3 c;
 if(pixelArt){
  float light=clamp(.22+.78*diffuse,0.,1.);
  float band=floor(light*(levels-.001))/(levels-1.);
  vec3 shade=mix(vColor*.43+vec3(.045,.025,.065),vColor,band);
  c=floor(shade*31.+.5)/31.;
 }else{c=vColor*(.30+.70*diffuse);}
 gl_FragColor=vec4(c,1.);
}`;
export const compositeFragment = `
uniform sampler2D source;uniform vec2 texel;uniform vec3 background;uniform bool outline;
uniform float shadowStyle;uniform float shadowStrength;uniform float shadowDotSize;
uniform float gridStyle;uniform float gridCell;uniform float gridGap;uniform float gridStrength;uniform vec3 gridColor;
varying vec2 vUv;
void main(){vec4 c=texture2D(source,vUv);float a=0.;
 a=max(a,texture2D(source,vUv+vec2(texel.x,0.)).a);
 a=max(a,texture2D(source,vUv-vec2(texel.x,0.)).a);
 a=max(a,texture2D(source,vUv+vec2(0.,texel.y)).a);
 a=max(a,texture2D(source,vUv-vec2(0.,texel.y)).a);
 vec3 base=background;
 if(outline && c.a<.5 && a>.9)base=vec3(.12,.105,.17);
 vec3 result=mix(base,c.rgb,c.a);
 if(shadowStyle>.5 && c.a>.1 && c.a<.9){
  float inside=1.;
  inside*=step(.1,texture2D(source,vUv+vec2(texel.x*2.,0.)).a);
  inside*=step(.1,texture2D(source,vUv-vec2(texel.x*2.,0.)).a);
  inside*=step(.1,texture2D(source,vUv+vec2(0.,texel.y*2.)).a);
  inside*=step(.1,texture2D(source,vUv-vec2(0.,texel.y*2.)).a);
  bool contact=c.a>.6;
  vec3 ink=vec3(.22,.18,.29);
  float density=contact?1.:(inside>.5?.62:.32);
  if(shadowStyle>1.5 && !contact){
   vec2 p=mod(floor(vUv/texel/shadowDotSize),2.);
   float bayer=p.y<.5?(p.x<.5?0.:2.):(p.x<.5?3.:1.);
   result=bayer<density*4.?mix(background,ink,shadowStrength*.76):background;
  }else result=mix(background,ink,shadowStrength*density);
 }
 // Grid is anchored to the source image, never to rotating 3D faces.
 // Four output subpixels per source pixel allow crisp, subpixel-width seams.
 if(gridStyle>0.5 && c.a>.9){
  vec2 p=mod(floor(vUv/texel*4.),vec2(gridCell*4.));
  float seam=max(1.-step(gridGap,p.x),1.-step(gridGap,p.y));
  if(gridStyle>1.5){
   vec2 center=abs(p-(gridCell*4.-1.)*.5);
   seam=step(gridGap+.5,min(center.x,center.y));
  }
  result=mix(result,gridColor,seam*gridStrength);
 }
 gl_FragColor=vec4(result,1.);
}`;
