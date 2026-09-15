// Independent procedural study: analytic shape, materials and lighting. No samplers.
export function proceduralPear(canvas){
 const gl=canvas.getContext('webgl',{antialias:false,alpha:false});if(!gl)throw Error('WebGL unavailable');
 const vs=`attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
 const fs=`precision highp float;varying vec2 uv;uniform vec2 res;uniform float phase;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float capsule(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.))-r;}
vec2 map(vec3 pos){vec3 p=pos;float a=phase*6.283185; p.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*p.xz;float y=p.y-.25;
float radius=.19+.57*exp(-pow((y+.36)/.65,2.))+.02*sin(y*12.);float r=length(p.xz);float pear=max((r-radius)*.65,max(y-1.,-1.02-y));pear+=.003*(noise(p*28.)-.5);vec2 d=vec2(pear,1.);
float stem=capsule(p,vec3(0,1.21,0),vec3(.12,1.66,.015),.042);if(stem<d.x)d=vec2(stem,2.);
vec3 leaf=p-vec3(.33,1.39,.015);leaf.xy=mat2(.9,-.436,.436,.9)*leaf.xy;float ld=(length(leaf/vec3(.34,.085,.15))-1.)*.065;if(ld<d.x)d=vec2(ld,3.);
float ped=min(box(pos-vec3(0,-.91,0),vec3(1.,.11,.78)),box(pos-vec3(0,-1.2,0),vec3(.78,.21,.62)));if(ped<d.x)d=vec2(ped,4.);return d;}
vec3 normal(vec3 p){vec2 e=vec2(.002,0);return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));}
void main(){vec2 q=(uv-.5)*vec2(res.x/res.y,1.);vec3 ro=vec3(2.8,1.5,5.4),target=vec3(0,.25,0);vec3 fw=normalize(target-ro),rt=normalize(cross(fw,vec3(0,1,0))),up=cross(rt,fw);vec3 rd=normalize(fw+rt*q.x*.85+up*q.y*.85);float t=0.;vec2 hit;for(int i=0;i<110;i++){hit=map(ro+rd*t);if(hit.x<.0015||t>12.)break;t+=hit.x*.85;}
vec3 col=mix(vec3(.015,.22,.39),vec3(.02,.40,.64),uv.y);col+=(noise(vec3(uv*95.,0.))-.5)*.016;
if(t<12.){vec3 p=ro+rd*t,n=normal(p);float rough=noise(p*42.);n=normalize(n+.045*vec3(noise(p*55.),noise(p*55.+7.),noise(p*55.+19.))-.0225);vec3 light=normalize(vec3(-3.+sin(phase*6.283)*.8,4.,4.));vec3 view=-rd,h=normalize(light+view);float diff=max(dot(n,light),0.),spec=pow(max(dot(n,h),0.),24.)*.85+pow(max(dot(n,h),0.),140.)*.7;float fres=pow(1.-max(dot(n,view),0.),4.);vec3 gold=mix(vec3(.36,.19,.025),vec3(.95,.70,.22),.5+.5*rough);col=gold*(.32+diff*.75)+vec3(1.,.91,.62)*spec+vec3(.10,.24,.34)*fres*.5;
if(hit.y>1.5&&hit.y<2.5)col=vec3(.26,.13,.028)*(.5+diff)+spec*.3;
if(hit.y>2.5&&hit.y<3.5){float veins=pow(abs(sin(p.x*43.+p.y*9.)),16.);col=vec3(.48,.35,.065)*(.35+diff)+vec3(.22,.16,.03)*veins+spec*.25;}
if(hit.y>3.5){float vein=pow(.5+.5*sin(p.x*14.+p.z*9.+noise(p*4.)*10.),18.);col=mix(vec3(.84,.81,.70),vec3(.36,.36,.32),vein*.38)*(.55+diff*.45);}
col*=.85+.15*clamp(map(p+n*.15).x/.15,0.,1.);}
col*=1.-.16*dot(q,q);gl_FragColor=vec4(pow(max(col,0.),vec3(.92)),1.);}`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(p,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);const r=gl.getUniformLocation(p,'res'),phase=gl.getUniformLocation(p,'phase');return t=>{gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(r,canvas.width,canvas.height);gl.uniform1f(phase,t);gl.drawArrays(gl.TRIANGLES,0,3);};
}
