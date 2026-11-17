#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const ICON_REPO = 'm-radzikowski/diagrams-aws-icons';
const CACHE_DIR = join(homedir(), '.cache', 'diagrams-aws-icons');
const SUPPORTED_SHAPES = ['rect', 'rectangle', 'text', 'group', 'image', 'ellipse', 'rhombus', 'label'];
const FONT = 'Helvetica, Arial, sans-serif';

// Helvetica advance widths (1/1000 em) for ASCII 32..126.
const HELVETICA = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];

const usage = `Usage:
  diagram.mjs icons <query...>                     list AWS icon titles matching every word
  diagram.mjs build <model.xml> <out.drawio.svg>   resolve awsIcon=, render the SVG, embed the model
  diagram.mjs render <file.drawio.svg> <out.jpg> [--scale 2] [--region x,y,w,h]
  diagram.mjs extract <file.drawio.svg> <model.xml> write the editable model back out`;

const [command, ...args] = process.argv.slice(2);
const commands = { icons: listIcons, build, render, extract };
if (!commands[command]) {
  console.error(usage);
  process.exit(1);
}
try {
  await commands[command](args);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

async function listIcons(words) {
  if (!words.length) throw new Error(usage);

  const library = await loadLibrary();
  const terms = words.map((word) => word.toLowerCase());
  const matches = [...library.icons.keys()].filter((title) => terms.every((term) => title.toLowerCase().includes(term)));
  console.log(`library ${library.version}, ${matches.length} match(es)`);
  for (const title of matches) {
    const frame = library.frames.get(title);
    console.log(frame ? `${title}\n  frame style: ${frame}` : title);
  }
}

async function build([source, output]) {
  if (!source || !output?.endsWith('.drawio.svg')) throw new Error(usage);

  const model = await resolveIcons(readModel(source));
  const { svg, warnings } = renderSvg(model);
  const mxfile = `<mxfile host="diagram.mjs"><diagram id="page-1" name="Page-1">${model}</diagram></mxfile>`;
  writeFileSync(output, svg.replace('<svg ', `<svg content="${escapeXml(mxfile)}" `));

  console.log(`wrote ${output}`);
  for (const warning of warnings) console.log(`warning: ${warning}`);
}

function render([file, output, ...flags]) {
  if (!file || !output) throw new Error(usage);

  const scale = Number(flagValue(flags, '--scale') ?? 2);
  const region = flagValue(flags, '--region')?.split(',').map(Number);
  const svg = readFileSync(file, 'utf8');
  const [minX, minY] = svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number) ?? [0, 0];
  const png = join(tmpdir(), `diagram-${process.pid}.png`);
  runTool('rsvg-convert', ['--zoom', String(scale), '--background-color', 'white', '--output', png, file]);
  const crop = region ? ['-crop', `${region[2] * scale}x${region[3] * scale}+${(region[0] - minX) * scale}+${(region[1] - minY) * scale}`, '+repage'] : [];
  runTool('magick', [png, ...crop, '-quality', '90', output]);
  rmSync(png);

  console.log(`wrote ${output}`);
}

async function extract([file, output]) {
  if (!file || !output) throw new Error(usage);

  const model = readModel(file);
  const library = model.includes('awsIcon=') ? await loadLibrary() : null;
  const collapsed = model.replace(/style="([^"]*awsIcon=[^"]*)"/g, (match, escaped) => {
    const style = parseStyle(unescapeXml(escaped));
    const iconStyle = parseStyle(library.icons.get(style.get('awsIcon')) ?? '');
    const own = [...style].filter(([key, value]) => key !== 'image' && iconStyle.get(key) !== value);
    return `style="${escapeXml(formatStyle(new Map(own)))}"`;
  });
  writeFileSync(output, collapsed);
  console.log(`wrote ${output}`);
}

function flagValue(flags, name) {
  const index = flags.indexOf(name);
  return index === -1 ? undefined : flags[index + 1];
}

function runTool(tool, toolArgs) {
  try {
    execFileSync(tool, toolArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`${tool} not found: brew install librsvg imagemagick`);
    throw new Error(`${tool} failed: ${error.stderr}`);
  }
}

function readModel(file) {
  const text = readFileSync(file, 'utf8');
  const content = text.trimStart().startsWith('<svg') ? unescapeXml(text.match(/\scontent="([^"]*)"/)?.[1] ?? '') : text;
  if (content.includes('<mxGraphModel')) return content.slice(content.indexOf('<mxGraphModel'), content.lastIndexOf('</mxGraphModel>') + 15);

  const compressed = content.match(/<diagram[^>]*>([^<]+)<\/diagram>/)?.[1];
  if (!compressed) throw new Error(`${file}: no draw.io model found`);
  return decodeURIComponent(inflateRawSync(Buffer.from(compressed.trim(), 'base64')).toString());
}

async function resolveIcons(model) {
  if (!model.includes('awsIcon=')) return model;

  const library = await loadLibrary();
  const unknown = [];
  const resolved = model.replace(/style="([^"]*awsIcon=[^"]*)"/g, (match, escaped) => {
    const style = parseStyle(unescapeXml(escaped));
    const title = style.get('awsIcon');
    const iconStyle = [...library.icons].find(([name]) => name.toLowerCase() === title.toLowerCase())?.[1];
    if (!iconStyle) {
      unknown.push(title);
      return match;
    }
    const merged = parseStyle(iconStyle);
    for (const [key, value] of style) if (key !== 'image' && key !== 'shape') merged.set(key, value);
    return `style="${escapeXml(formatStyle(merged))}"`;
  });

  if (unknown.length) throw new Error(`unknown awsIcon: ${unknown.join(', ')} (search with: diagram.mjs icons <words>)`);
  return resolved;
}

async function loadLibrary() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const cached = readdirSync(CACHE_DIR).filter((name) => /^\d{8}\.xml$/.test(name)).sort();
  const today = new Date().toISOString().slice(0, 10);
  const checkedFile = join(CACHE_DIR, 'checked');
  const checkedToday = existsSync(checkedFile) && readFileSync(checkedFile, 'utf8') === today;
  const version = checkedToday && cached.length ? cached.at(-1).slice(0, 8) : await latestVersion().catch(() => cached.at(-1)?.slice(0, 8));
  if (!version) throw new Error(`cannot reach github.com/${ICON_REPO} and no cached icon library in ${CACHE_DIR}`);

  const file = join(CACHE_DIR, `${version}.xml`);
  if (!existsSync(file)) writeFileSync(file, await downloadLibrary(version));
  writeFileSync(checkedFile, today);
  return { version, ...parseLibrary(readFileSync(file, 'utf8')) };
}

async function latestVersion() {
  const entries = await githubJson(`https://api.github.com/repos/${ICON_REPO}/contents`);
  return entries.map((entry) => entry.name).filter((name) => /^\d{8}$/.test(name)).sort().at(-1);
}

async function downloadLibrary(version) {
  const entries = await githubJson(`https://api.github.com/repos/${ICON_REPO}/contents/${version}`);
  const library = entries.find((entry) => entry.name.endsWith('.xml'));
  if (!library) throw new Error(`no .xml library in ${ICON_REPO}/${version}`);
  const response = await fetch(library.download_url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`download ${library.download_url}: ${response.status}`);
  return response.text();
}

async function githubJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

function parseLibrary(text) {
  const entries = JSON.parse(text.trim().replace(/^<mxlibrary>/, '').replace(/<\/mxlibrary>$/, ''));
  const icons = new Map();
  const frames = new Map();

  for (const entry of entries) {
    const xml = entry.xml.startsWith('&lt;') ? unescapeXml(entry.xml) : decodeURIComponent(inflateRawSync(Buffer.from(entry.xml, 'base64')).toString());
    const cells = [...xml.matchAll(/<mxCell\b[^>]*>/g)].map((match) => attributes(match[0]));
    const image = cells.find((cell) => cell.style?.includes('shape=image'));
    if (!image) continue;
    if (entry.title) {
      icons.set(entry.title, image.style);
      continue;
    }
    const frame = cells.find((cell) => cell.value);
    const base = `${frame.value} group`;
    const title = icons.has(base) ? `${base} (alt)` : base;
    icons.set(title, image.style);
    frames.set(title, frame.style);
  }
  return { icons, frames };
}

function renderSvg(model) {
  const cells = parseCells(model).map((cell, order) => ({ ...cell, order }));
  const byId = new Map(cells.map((cell) => [cell.id, cell]));
  const vertices = cells.filter((cell) => cell.vertex && cell.geometry);
  for (const cell of vertices) cell.box = absoluteBox(cell, byId);
  for (const cell of vertices) cell.labelBox = vertexLabel(cell);

  const edges = cells.filter((cell) => cell.edge);
  for (const edge of edges) edge.route = routeEdge(edge, byId);

  const body = cells.map((cell) => (cell.vertex && cell.box ? drawVertex(cell) : cell.edge && cell.route ? drawEdge(cell) : '')).join('');
  const bounds = diagramBounds(vertices, edges);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${bounds.w}px" height="${bounds.h}px" viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}" style="background-color: #FFFFFF;"><rect x="${bounds.x}" y="${bounds.y}" width="${bounds.w}" height="${bounds.h}" fill="#FFFFFF"/>${body}</svg>\n`;
  return { svg, warnings: lint(vertices, edges) };
}

function parseCells(model) {
  const cells = [];
  const wrapperStack = [];
  let current = null;

  for (const match of model.matchAll(/<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g)) {
    const [, closing, name, attrText, selfClosing] = match;
    if (closing) {
      if (name === 'mxCell') current = null;
      if (name === 'UserObject' || name === 'object') wrapperStack.pop();
      if (name === 'Array') current && (current.inPoints = false);
      continue;
    }
    const attrs = attributes(attrText);
    if (name === 'UserObject' || name === 'object') {
      if (!selfClosing) wrapperStack.push(attrs);
      continue;
    }
    if (name === 'mxCell') {
      const wrapper = wrapperStack.at(-1);
      const cell = { ...attrs, id: wrapper?.id ?? attrs.id, value: wrapper?.label ?? attrs.value ?? '', style: parseStyle(attrs.style ?? ''), vertex: attrs.vertex === '1', edge: attrs.edge === '1', points: [] };
      cells.push(cell);
      current = selfClosing ? null : cell;
      continue;
    }
    if (!current) continue;
    if (name === 'mxGeometry') current.geometry = { x: num(attrs.x), y: num(attrs.y), w: num(attrs.width), h: num(attrs.height) };
    if (name === 'Array' && attrs.as === 'points') current.inPoints = !selfClosing;
    if (name !== 'mxPoint') continue;
    const point = { x: num(attrs.x), y: num(attrs.y) };
    if (current.inPoints) current.points.push(point);
    else if (attrs.as) current[attrs.as] = point;
  }
  return cells;
}

function num(value) {
  return value === undefined ? 0 : Number(value);
}

function absoluteBox(cell, byId) {
  const parent = byId.get(cell.parent);
  const origin = parent?.vertex && parent.geometry ? absoluteBox(parent, byId) : { x: 0, y: 0 };
  return { x: origin.x + cell.geometry.x, y: origin.y + cell.geometry.y, w: cell.geometry.w, h: cell.geometry.h };
}

function vertexLabel(cell) {
  if (!cell.value) return null;

  const style = cell.style;
  const fontSize = Number(style.get('fontSize') ?? 12);
  const spacing = Number(style.get('spacing') ?? 2);
  const pad = {
    top: spacing + Number(style.get('spacingTop') ?? 0),
    bottom: spacing + Number(style.get('spacingBottom') ?? 0),
    left: spacing + Number(style.get('spacingLeft') ?? 0),
    right: spacing + Number(style.get('spacingRight') ?? 0),
  };
  const { x, y, w, h } = cell.box;
  const area = {
    x: style.get('labelPosition') === 'right' ? x + w : style.get('labelPosition') === 'left' ? x - w : x,
    y: style.get('verticalLabelPosition') === 'bottom' ? y + h : style.get('verticalLabelPosition') === 'top' ? y - h : y,
    w,
    h,
  };
  const wrapWidth = style.get('whiteSpace') === 'wrap' ? area.w - pad.left - pad.right : Infinity;
  const lines = layoutLines(parseRuns(cell.value, style), fontSize, style.get('fontStyle'), wrapWidth);
  const lineHeight = fontSize * 1.2;
  const textHeight = lines.length * lineHeight;
  const blockWidth = Math.max(...lines.map((line) => line.width));
  const align = style.get('align') ?? 'center';
  const verticalAlign = style.get('verticalAlign') ?? 'middle';
  const left = align === 'left' ? area.x + pad.left : align === 'right' ? area.x + area.w - pad.right - blockWidth : area.x + (area.w + pad.left - pad.right - blockWidth) / 2;
  const top = verticalAlign === 'top' ? area.y + pad.top : verticalAlign === 'bottom' ? area.y + area.h - pad.bottom - textHeight : area.y + (area.h + pad.top - pad.bottom - textHeight) / 2;
  return { x: left, y: top, w: blockWidth, h: textHeight, lines, fontSize, lineHeight, align };
}

function parseRuns(value, style) {
  const html = style.get('html') === '1';
  const text = html ? value : escapeXml(value).replace(/\n/g, '<br>');
  const runs = [];
  const stack = [{ bold: false, italic: false, color: null }];

  for (const match of text.matchAll(/<(\/?)(\w+)([^>]*)>|([^<]+)/g)) {
    const [, closing, tag, attrText, content] = match;
    const state = stack.at(-1);
    if (content) {
      runs.push({ ...state, text: unescapeXml(content.replace(/&nbsp;/g, ' ')).replace(/\s+/g, ' ') });
      continue;
    }
    const name = tag.toLowerCase();
    if (name === 'br' || ((name === 'div' || name === 'p') && !closing && runs.length)) {
      runs.push({ ...state, text: '\n' });
      continue;
    }
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const color = attrText.match(/color:\s*([^;'"]+)/)?.[1] ?? attrText.match(/color=["']([^"']+)/)?.[1];
    stack.push({ bold: state.bold || name === 'b' || name === 'strong', italic: state.italic || name === 'i' || name === 'em', color: color ?? state.color });
  }
  return runs;
}

function layoutLines(runs, fontSize, fontStyle, wrapWidth) {
  const baseBold = (Number(fontStyle ?? 0) & 1) === 1;
  const lines = [{ parts: [], width: 0 }];

  for (const run of runs) {
    if (run.text === '\n') {
      lines.push({ parts: [], width: 0 });
      continue;
    }
    const bold = run.bold || baseBold;
    for (const word of run.text.split(/(?<= )/)) {
      const line = lines.at(-1);
      const width = textWidth(word, fontSize, bold);
      if (line.width + textWidth(word.trimEnd(), fontSize, bold) > wrapWidth && line.parts.length) {
        line.width -= trailingSpace(line, fontSize);
        lines.push({ parts: [], width: 0 });
      }
      const target = lines.at(-1);
      if (!target.parts.length && word === ' ') continue;
      target.parts.push({ ...run, bold, text: word });
      target.width += width;
    }
  }
  for (const line of lines) line.width -= trailingSpace(line, fontSize);
  return lines;
}

function trailingSpace(line, fontSize) {
  const last = line.parts.at(-1);
  if (!last?.text.endsWith(' ')) return 0;
  last.text = last.text.trimEnd();
  return textWidth(' ', fontSize, last.bold);
}

function textWidth(text, fontSize, bold) {
  const units = [...text].reduce((sum, char) => sum + (HELVETICA[char.charCodeAt(0) - 32] ?? 556), 0);
  return (units / 1000) * fontSize * (bold ? 1.07 : 1);
}

function drawVertex(cell) {
  const style = cell.style;
  const { x, y, w, h } = cell.box;
  const opacity = style.has('opacity') ? ` opacity="${Number(style.get('opacity')) / 100}"` : '';
  const shape = shapeName(style);
  const isText = shape === 'text' || shape === 'group';
  const fill = style.get('fillColor') ?? (isText ? 'none' : '#FFFFFF');
  const stroke = style.get('strokeColor') ?? (isText ? 'none' : '#000000');
  const paint = `fill="${color(fill)}" stroke="${color(stroke)}" stroke-width="${style.get('strokeWidth') ?? 1}"${dash(style)}${opacity}`;

  const shapeSvg = (() => {
    if (shape === 'image') return `<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" xlink:href="${imageHref(style.get('image'))}"${opacity}/>`;
    if (shape === 'rhombus') return `<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}" ${paint}/>`;
    if (shape === 'ellipse') return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" ${paint}/>`;
    if (isText || (fill === 'none' && stroke === 'none')) return '';
    const radius = style.get('rounded') === '1' ? (Math.min(w, h) * Number(style.get('arcSize') ?? 15)) / 100 : 0;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" ${paint}/>`;
  })();
  return shapeSvg + drawLabel(cell.labelBox, style);
}

function shapeName(style) {
  return style.get('shape') ?? [...style.keys()].find((key) => style.get(key) === undefined) ?? 'rect';
}

function drawLabel(label, style) {
  if (!label) return '';

  const fontColor = color(style.get('fontColor') ?? '#000000');
  const baseItalic = (Number(style.get('fontStyle') ?? 0) & 2) === 2;
  const opacity = style.has('textOpacity') ? ` opacity="${Number(style.get('textOpacity')) / 100}"` : '';
  const background = style.get('labelBackgroundColor');
  const backgroundSvg = background && background !== 'none' ? `<rect x="${label.x - 2}" y="${label.y}" width="${label.w + 4}" height="${label.h}" fill="${color(background)}"/>` : '';
  const lineX = label.align === 'left' ? label.x : label.align === 'right' ? label.x + label.w : label.x + label.w / 2;

  const lines = label.lines.map((line, index) => {
    const lineStart = label.align === 'left' ? lineX : label.align === 'right' ? lineX - line.width : lineX - line.width / 2;
    const baseline = label.y + index * label.lineHeight + label.fontSize * 0.95;
    const spans = line.parts.map((part) => `<tspan${part.bold ? ' font-weight="bold"' : ''}${part.italic || baseItalic ? ' font-style="italic"' : ''}${part.color ? ` fill="${color(part.color)}"` : ''}>${escapeXml(part.text)}</tspan>`).join('');
    return `<text x="${round(lineStart)}" y="${round(baseline)}" fill="${fontColor}" font-family="${FONT}" font-size="${label.fontSize}px" xml:space="preserve">${spans}</text>`;
  });
  return `<g${opacity}>${backgroundSvg}${lines.join('')}</g>`;
}

function imageHref(image = '') {
  const [header, data = ''] = image.split(/,(.*)/s);
  if (header.endsWith(';base64') || /^[A-Za-z0-9+/=]+$/.test(data)) return `data:image/svg+xml;base64,${data}`;
  return `data:image/svg+xml;base64,${Buffer.from(decodeURIComponent(data)).toString('base64')}`;
}

function routeEdge(edge, byId) {
  const style = edge.style;
  const source = byId.get(edge.source)?.box;
  const target = byId.get(edge.target)?.box;
  const start = port(source, style, 'exit') ?? edge.sourcePoint;
  const end = port(target, style, 'entry') ?? edge.targetPoint;
  if ((!source && !start) || (!target && !end)) return null;

  const orthogonal = ['orthogonalEdgeStyle', 'elbowEdgeStyle'].includes(style.get('edgeStyle'));
  if (!orthogonal) {
    const first = start ?? clipToBox(source, edge.points[0] ?? end ?? centre(target));
    const last = end ?? clipToBox(target, edge.points.at(-1) ?? first);
    return [first, ...edge.points, last];
  }

  const via = edge.points;
  const firstGoal = via[0] ?? end ?? centre(target);
  const lastGoal = via.at(-1) ?? start ?? centre(source);
  const first = start ?? orthogonalExit(source, firstGoal, target, !via.length);
  const last = end ?? orthogonalExit(target, lastGoal, source, !via.length);
  const route = [first];
  for (const point of [...via, last]) {
    const previous = route.at(-1);
    if (previous.x !== point.x && previous.y !== point.y) {
      const horizontal = route.length === 1 ? leavesHorizontally(source, previous, style.get('exitX')) : route.at(-2).y === previous.y;
      const isLast = point === last;
      const entersHorizontally = isLast && (end ? ['0', '1'].includes(style.get('entryX')) : target && last.y > target.y && last.y < target.y + target.h);
      if (isLast && route.length === 1 && horizontal === entersHorizontally) {
        const midX = (previous.x + point.x) / 2;
        const midY = (previous.y + point.y) / 2;
        route.push(...(horizontal ? [{ x: midX, y: previous.y }, { x: midX, y: point.y }] : [{ x: previous.x, y: midY }, { x: point.x, y: midY }]));
      } else {
        route.push(horizontal ? { x: point.x, y: previous.y } : { x: previous.x, y: point.y });
      }
    }
    route.push(point);
  }
  return route.filter((point, index) => index === 0 || point.x !== route[index - 1].x || point.y !== route[index - 1].y);
}

function port(box, style, kind) {
  if (!box || !style.has(`${kind}X`)) return null;
  return { x: box.x + box.w * Number(style.get(`${kind}X`)) + Number(style.get(`${kind}Dx`) ?? 0), y: box.y + box.h * Number(style.get(`${kind}Y`)) + Number(style.get(`${kind}Dy`) ?? 0) };
}

function centre(box) {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

function leavesHorizontally(box, point, exitX) {
  if (exitX !== undefined) return ['0', '1'].includes(exitX);
  return Boolean(box) && point.y > box.y && point.y < box.y + box.h;
}

function orthogonalExit(box, goal, other, direct) {
  const overlapY = direct && other ? overlap(box.y, box.h, other.y, other.h) : null;
  const overlapX = direct && other ? overlap(box.x, box.w, other.x, other.w) : null;
  if (overlapY) return { x: goal.x > box.x + box.w ? box.x + box.w : box.x, y: overlapY };
  if (overlapX) return { x: overlapX, y: goal.y > box.y + box.h ? box.y + box.h : box.y };
  if (!direct && goal.y >= box.y && goal.y <= box.y + box.h) return { x: goal.x > box.x ? box.x + box.w : box.x, y: goal.y };
  if (!direct && goal.x >= box.x && goal.x <= box.x + box.w) return { x: goal.x, y: goal.y > box.y ? box.y + box.h : box.y };

  const c = centre(box);
  if (Math.abs(goal.x - c.x) >= Math.abs(goal.y - c.y)) return { x: goal.x > c.x ? box.x + box.w : box.x, y: c.y };
  return { x: c.x, y: goal.y > c.y ? box.y + box.h : box.y };
}

function overlap(a, aSize, b, bSize) {
  const low = Math.max(a, b);
  const high = Math.min(a + aSize, b + bSize);
  return high > low ? (low + high) / 2 : null;
}

function clipToBox(box, toward) {
  const c = centre(box);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (!dx && !dy) return c;
  const scale = Math.min(dx ? box.w / 2 / Math.abs(dx) : Infinity, dy ? box.h / 2 / Math.abs(dy) : Infinity);
  return { x: c.x + dx * scale, y: c.y + dy * scale };
}

function drawEdge(edge) {
  const style = edge.style;
  const stroke = color(style.get('strokeColor') ?? '#000000');
  const width = style.get('strokeWidth') ?? 1;
  const endArrow = style.get('endArrow') ?? 'classic';
  const startArrow = style.get('startArrow') ?? 'none';
  const route = edge.route.map((point) => ({ ...point }));
  const ends = [
    arrow(route.at(-2), route.at(-1), endArrow, style.get('endFill') !== '0', stroke),
    arrow(route[1], route[0], startArrow, style.get('startFill') !== '0', stroke),
  ];
  if (endArrow !== 'none') route[route.length - 1] = shorten(route.at(-2), route.at(-1), 10);
  if (startArrow !== 'none') route[0] = shorten(route[1], route[0], 10);
  const path = `<path d="${pathData(route, style.get('rounded') === '1')}" fill="none" stroke="${stroke}" stroke-width="${width}"${dash(style)} stroke-linejoin="round"/>`;
  edge.labelBox = edgeLabel(edge);
  return path + ends.join('') + drawLabel(edge.labelBox, new Map([['labelBackgroundColor', '#FFFFFF'], ...style]));
}

function arrow(from, tip, kind, filled, stroke) {
  if (kind === 'none' || !from) return '';

  const length = Math.hypot(tip.x - from.x, tip.y - from.y) || 1;
  const ux = (tip.x - from.x) / length;
  const uy = (tip.y - from.y) / length;
  const base = { x: tip.x - ux * 10, y: tip.y - uy * 10 };
  const left = { x: base.x - uy * 4, y: base.y + ux * 4 };
  const right = { x: base.x + uy * 4, y: base.y - ux * 4 };
  if (kind === 'open') return `<path d="M ${round(left.x)} ${round(left.y)} L ${round(tip.x)} ${round(tip.y)} L ${round(right.x)} ${round(right.y)}" fill="none" stroke="${stroke}"/>`;
  return `<path d="M ${round(tip.x)} ${round(tip.y)} L ${round(left.x)} ${round(left.y)} L ${round(right.x)} ${round(right.y)} Z" fill="${filled ? stroke : '#FFFFFF'}" stroke="${stroke}"/>`;
}

function shorten(from, tip, by) {
  const length = Math.hypot(tip.x - from.x, tip.y - from.y);
  if (length <= by) return tip;
  return { x: tip.x - ((tip.x - from.x) / length) * by, y: tip.y - ((tip.y - from.y) / length) * by };
}

function pathData(route, rounded) {
  const commands = [`M ${round(route[0].x)} ${round(route[0].y)}`];
  for (let index = 1; index < route.length; index++) {
    const point = route[index];
    const next = route[index + 1];
    if (!rounded || !next) {
      commands.push(`L ${round(point.x)} ${round(point.y)}`);
      continue;
    }
    const previous = route[index - 1];
    const radius = Math.min(10, Math.hypot(point.x - previous.x, point.y - previous.y) / 2, Math.hypot(next.x - point.x, next.y - point.y) / 2);
    const before = shorten(previous, point, radius);
    const after = shorten(next, point, radius);
    commands.push(`L ${round(before.x)} ${round(before.y)} Q ${round(point.x)} ${round(point.y)} ${round(after.x)} ${round(after.y)}`);
  }
  return commands.join(' ');
}

function edgeLabel(edge) {
  if (!edge.value) return null;

  const segments = edge.route.slice(1).map((point, index) => ({ from: edge.route[index], to: point, length: Math.hypot(point.x - edge.route[index].x, point.y - edge.route[index].y) }));
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  const along = ((num(edge.geometry?.x) + 1) / 2) * total;
  const { point } = segments.reduce(
    (state, segment) => {
      if (state.point || state.left > segment.length) return { ...state, left: state.left - segment.length };
      const ratio = segment.length ? state.left / segment.length : 0;
      return { ...state, point: { x: segment.from.x + (segment.to.x - segment.from.x) * ratio, y: segment.from.y + (segment.to.y - segment.from.y) * ratio } };
    },
    { left: along, point: null },
  );
  const anchor = point ?? edge.route.at(-1);
  const fontSize = Number(edge.style.get('fontSize') ?? 11);
  const lines = layoutLines(parseRuns(edge.value, edge.style), fontSize, edge.style.get('fontStyle'), Infinity);
  const width = Math.max(...lines.map((line) => line.width));
  const height = lines.length * fontSize * 1.2;
  const x = anchor.x + num(edge.offset?.x);
  const y = anchor.y + num(edge.offset?.y) + num(edge.geometry?.y);
  return { x: x - width / 2, y: y - height / 2, w: width, h: height, lines, fontSize, lineHeight: fontSize * 1.2, align: 'center' };
}

function diagramBounds(vertices, edges) {
  const boxes = [...vertices.flatMap((cell) => [cell.box, cell.labelBox]), ...edges.flatMap((edge) => [...(edge.route ?? []).map((point) => ({ ...point, w: 0, h: 0 })), edge.labelBox])].filter(Boolean);
  if (!boxes.length) return { x: 0, y: 0, w: 100, h: 100 };
  const minX = Math.floor(Math.min(...boxes.map((box) => box.x))) - 10;
  const minY = Math.floor(Math.min(...boxes.map((box) => box.y))) - 10;
  const maxX = Math.ceil(Math.max(...boxes.map((box) => box.x + box.w))) + 10;
  const maxY = Math.ceil(Math.max(...boxes.map((box) => box.y + box.h))) + 10;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function lint(vertices, edges) {
  const warnings = [];
  const labelled = vertices.filter((cell) => cell.labelBox);

  for (const edge of edges) {
    if (!edge.route) {
      warnings.push(`edge ${edge.id} has no source/target and no sourcePoint/targetPoint; not drawn`);
      continue;
    }
    const covering = (owner) => owner.vertex && owner.order > edge.order && owner.style.get('fillColor') !== 'none' && !['text', 'image'].includes(shapeName(owner.style));
    for (const owner of [...labelled, ...edges.filter((other) => other !== edge && other.labelBox)].filter((owner) => !covering(owner))) {
      const hit = edge.route.slice(1).some((point, index) => segmentHitsBox(edge.route[index], point, shrink(owner.labelBox, 1)));
      if (hit) warnings.push(`edge ${edge.id} crosses the label of ${owner.id} ("${plain(owner.value)}")`);
    }
    for (const cell of vertices.filter((vertex) => vertex.id !== edge.source && vertex.id !== edge.target && vertex.style.get('shape') === 'image')) {
      const hit = edge.route.slice(1).some((point, index) => segmentHitsBox(edge.route[index], point, shrink(cell.box, 2)));
      if (hit) warnings.push(`edge ${edge.id} runs through icon ${cell.id}`);
    }
  }

  for (const cell of vertices.filter((vertex) => !SUPPORTED_SHAPES.includes(shapeName(vertex.style)))) {
    warnings.push(`${cell.id}: shape "${shapeName(cell.style)}" is drawn as a rectangle here; draw.io will draw it properly`);
  }

  const framed = vertices.filter((cell) => !['image', 'text', 'group'].includes(cell.style.get('shape')) && !cell.style.has('text') && !cell.style.has('group') && cell.style.get('strokeColor') !== 'none');
  const labels = [...labelled.map((cell) => [cell, cell.labelBox]), ...edges.filter((edge) => edge.labelBox).map((edge) => [edge, edge.labelBox])];
  for (const [owner, label] of labels) {
    for (const frame of framed.filter((cell) => cell !== owner)) {
      if (intersects(shrink(label, 1), frame.box) && !contains(frame.box, label)) warnings.push(`label of ${owner.id} sits on the border of ${frame.id}`);
    }
  }

  const leaves = vertices.filter((cell) => cell.style.get('shape') !== 'group');
  for (const [index, a] of leaves.entries()) {
    for (const b of leaves.slice(index + 1)) {
      if (intersects(a.box, b.box) && !contains(a.box, b.box) && !contains(b.box, a.box)) warnings.push(`${a.id} and ${b.id} overlap`);
      if (a.labelBox && b.labelBox && intersects(shrink(a.labelBox, 1), shrink(b.labelBox, 1))) warnings.push(`labels of ${a.id} and ${b.id} overlap`);
      if (a.labelBox && b.style.get('shape') === 'image' && intersects(shrink(a.labelBox, 1), b.box)) warnings.push(`label of ${a.id} overlaps icon ${b.id}`);
      if (b.labelBox && a.style.get('shape') === 'image' && intersects(shrink(b.labelBox, 1), a.box)) warnings.push(`label of ${b.id} overlaps icon ${a.id}`);
    }
    const label = a.labelBox;
    const inside = !a.style.has('verticalLabelPosition') && !a.style.has('labelPosition');
    if (label && inside && a.style.get('shape') !== 'image' && (label.h > a.box.h + 1 || (a.style.get('whiteSpace') === 'wrap' && label.w > a.box.w + 1))) warnings.push(`text of ${a.id} overflows its box ("${plain(a.value).slice(0, 40)}")`);
  }
  return warnings;
}

function plain(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function shrink(box, by) {
  return { x: box.x + by, y: box.y + by, w: box.w - 2 * by, h: box.h - 2 * by };
}

function intersects(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function contains(outer, inner) {
  return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
}

function segmentHitsBox(a, b, box) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  if (maxX < box.x || minX > box.x + box.w || maxY < box.y || minY > box.y + box.h) return false;
  if (a.x === b.x || a.y === b.y) return true;
  const corners = [
    [box.x, box.y],
    [box.x + box.w, box.y],
    [box.x, box.y + box.h],
    [box.x + box.w, box.y + box.h],
  ].map(([x, y]) => Math.sign((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)));
  return new Set(corners).size > 1;
}

function dash(style) {
  if (style.get('dashed') !== '1') return '';
  return ` stroke-dasharray="${style.get('dashPattern') ?? '3 3'}"`;
}

function color(value) {
  return value === 'default' ? '#FFFFFF' : value;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function parseStyle(text) {
  return new Map(
    text
      .split(';')
      .filter(Boolean)
      .map((entry) => {
        const index = entry.indexOf('=');
        return index === -1 ? [entry, undefined] : [entry.slice(0, index), entry.slice(index + 1)];
      }),
  );
}

function formatStyle(style) {
  return `${[...style].map(([key, value]) => (value === undefined ? key : `${key}=${value}`)).join(';')};`;
}

function attributes(text) {
  return Object.fromEntries([...text.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(([, name, double, single]) => [name, unescapeXml(double ?? single)]));
}

function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#xa;');
}

function unescapeXml(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|lt|gt|quot|apos|amp);/gi, (match, entity) => {
    const named = { lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' }[entity.toLowerCase()];
    if (named) return named;
    return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10));
  });
}
