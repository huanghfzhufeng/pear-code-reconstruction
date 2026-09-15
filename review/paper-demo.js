import { STAGE_VERTEX, stageFragment } from "../src/shaders/stage.js";
import { paper } from "../src/data/paper.js";
/** The actual paper shader, with the picture samplers unused. Zero image/video requests. */
export function startPaperDemo(canvas) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) return false;
  const shader = (type, text) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, text);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw Error(gl.getShaderInfoLog(s));
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, STAGE_VERTEX));
  gl.attachShader(
    program,
    shader(
      gl.FRAGMENT_SHADER,
      stageFragment(!!gl.getExtension("OES_standard_derivatives"), false),
    ),
  );
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const pos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255]),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const location = (name) => gl.getUniformLocation(program, name);
  gl.uniform1f(location("uCoda"), 1);
  gl.uniform1f(location("uFlat"), 1);
  gl.uniform3f(
    location("uPaperC"),
    paper.r / 255,
    paper.g / 255,
    paper.b / 255,
  );
  gl.uniform4f(
    location("uPap"),
    paper.pulp,
    paper.fibre,
    paper.tooth,
    paper.fleck,
  );
  gl.uniform4f(
    location("uRay1"),
    paper.speed,
    paper.drift,
    paper.jiggle,
    paper.scale,
  );
  gl.uniform4f(
    location("uRay2"),
    paper.depth,
    paper.breathe,
    paper.rake,
    paper.cycle,
  );
  let visible = true;
  const reduced = matchMedia("(prefers-reduced-motion:reduce)");
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
  }).observe(canvas);
  let painted = false;
  function draw(time) {
    if (visible && !document.hidden && (!reduced.matches || !painted)) {
      gl.viewport(0, 0, 640, 400);
      gl.uniform2f(location("uRes"), 640, 400);
      gl.uniform1f(location("uTime"), reduced.matches ? 0 : time / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      painted = true;
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  canvas.dataset.procedural = "true";
  return true;
}
