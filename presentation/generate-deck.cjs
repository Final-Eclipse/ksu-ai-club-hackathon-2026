const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const W = 960;
const H = 540;
const TOTAL = 9;

const C = {
  ink: '#0D0E12',
  panel: '#17181D',
  panel2: '#202126',
  line: '#393A40',
  white: '#F6F2E9',
  muted: '#B6B1A8',
  dim: '#77746E',
  yellow: '#FDBB30',
  green: '#79D45E',
  blue: '#4DB6E8',
  coral: '#FF725E',
  magenta: '#E55BA5',
};

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'OwlFlow-Hackathon-Pitch.pdf');
const KENNESAW_MAP = path.join(ROOT, 'public', 'maps', 'ksu-kennesaw.png');
const MARIETTA_MAP = path.join(ROOT, 'public', 'maps', 'ksu-marietta.png');
const REPO_URL = 'https://github.com/Final-Eclipse/owlflow/tree/feat/owlflow-p4b';

const SOURCES = {
  ksu: 'https://www.kennesaw.edu/about/',
  parkingStudy: 'https://www.uvu.edu/criminaljustice/docs/student-research/uvuparkingandpedestrians.pdf',
  foodWaste: 'https://drum.lib.umd.edu/items/64221721-526e-4140-a8f7-4d76bfc30ebf/full',
  ksuParking: 'https://www.kennesaw.edu/news/stories/2026/ksu-adds-new-buses-more-parking-spaces-for-fall-2026-semester.php',
  geminiPricing: 'https://aistudio.google.com/docs/pricing',
};

const doc = new PDFDocument({
  autoFirstPage: false,
  size: [W, H],
  margin: 0,
  compress: true,
  info: {
    Title: 'OwlFlow — One schedule. Every campus move.',
    Author: 'Team OwlFlow',
    Subject: 'AI Club Hackathon 2026 five-minute pitch',
    Keywords: 'OwlFlow, KSU, campus, AI, parking, dining, laundry',
    CreationDate: new Date('2026-11-20T12:00:00Z'),
  },
});

const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

function text(value, x, y, width, size, color = C.white, font = 'Helvetica', options = {}) {
  doc.font(font).fontSize(size).fillColor(color);
  doc.text(value, x, y, {
    width,
    lineGap: options.lineGap ?? 2,
    ...options,
  });
  return doc;
}

function mono(value, x, y, width, size, color = C.white, options = {}) {
  return text(value, x, y, width, size, color, 'Courier-Bold', options);
}

function smallCaps(value, x, y, width, color = C.muted, size = 10, options = {}) {
  return text(value.toUpperCase(), x, y, width, size, color, 'Helvetica-Bold', {
    characterSpacing: 1.35,
    ...options,
  });
}

function rule(x, y, width, color = C.line, lineWidth = 1) {
  doc.save().strokeColor(color).lineWidth(lineWidth).moveTo(x, y).lineTo(x + width, y).stroke().restore();
}

function panel(x, y, width, height, accent = C.yellow, radius = 12, fill = C.panel) {
  doc.save();
  doc.roundedRect(x + 4, y + 5, width, height, radius).fillOpacity(0.2).fill('#000000');
  doc.fillOpacity(1).roundedRect(x, y, width, height, radius).fillAndStroke(fill, C.line);
  doc.roundedRect(x, y, width, 6, radius).fill(accent);
  doc.restore();
}

function pill(value, x, y, width, color = C.green, fill = C.panel2, size = 10) {
  doc.save().roundedRect(x, y, width, 24, 12).fill(fill).strokeColor(C.line).stroke();
  text(value, x, y + 6, width, size, color, 'Helvetica-Bold', { align: 'center', lineGap: 0 });
  doc.restore();
}

function sourceTag(id, x, y, color = C.blue) {
  doc.save().roundedRect(x, y, 28, 18, 9).fill(C.panel2).strokeColor(C.line).stroke();
  text(`[${id}]`, x, y + 4, 28, 8.5, color, 'Helvetica-Bold', { align: 'center', lineGap: 0 });
  doc.restore();
}

function drawGrid() {
  doc.save().opacity(0.12).strokeColor('#56575D').lineWidth(0.45);
  for (let x = 0; x <= W; x += 48) doc.moveTo(x, 0).lineTo(x, H).stroke();
  for (let y = 0; y <= H; y += 48) doc.moveTo(0, y).lineTo(W, y).stroke();
  doc.restore();
}

function drawOwlMark(x, y, size) {
  doc.save();
  doc.roundedRect(x, y, size, size, size * 0.22).fill(C.yellow);
  doc.circle(x + size / 2, y + size / 2, size * 0.32).fill(C.ink);
  doc.path(`M ${x + size * 0.20} ${y + size * 0.37} L ${x + size * 0.14} ${y + size * 0.16} L ${x + size * 0.35} ${y + size * 0.29} C ${x + size * 0.45} ${y + size * 0.23}, ${x + size * 0.55} ${y + size * 0.23}, ${x + size * 0.65} ${y + size * 0.29} L ${x + size * 0.86} ${y + size * 0.16} L ${x + size * 0.80} ${y + size * 0.37}`).fill(C.ink);
  doc.circle(x + size * 0.39, y + size * 0.49, size * 0.11).fill(C.yellow);
  doc.circle(x + size * 0.61, y + size * 0.49, size * 0.11).fill(C.yellow);
  doc.circle(x + size * 0.39, y + size * 0.49, size * 0.045).fill(C.ink);
  doc.circle(x + size * 0.61, y + size * 0.49, size * 0.045).fill(C.ink);
  doc.path(`M ${x + size * 0.44} ${y + size * 0.66} L ${x + size * 0.50} ${y + size * 0.74} L ${x + size * 0.56} ${y + size * 0.66} Z`).fill(C.yellow);
  doc.restore();
}

function drawArrow(x1, y1, x2, y2, color = C.yellow, width = 2) {
  doc.save().strokeColor(color).fillColor(color).lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const a = 9;
  doc.polygon(
    [x2, y2],
    [x2 - a * Math.cos(angle - Math.PI / 6), y2 - a * Math.sin(angle - Math.PI / 6)],
    [x2 - a * Math.cos(angle + Math.PI / 6), y2 - a * Math.sin(angle + Math.PI / 6)]
  ).fill(color);
  doc.restore();
}

function drawCheck(x, y, color = C.green) {
  doc.save().strokeColor(color).lineWidth(2.4).lineCap('round');
  doc.moveTo(x, y + 6).lineTo(x + 5, y + 11).lineTo(x + 14, y).stroke();
  doc.restore();
}

function footer(number, activeColor = C.yellow) {
  const y = 511;
  smallCaps('OWL FLOW · KSU CAMPUS INTELLIGENCE', 52, y, 420, C.dim, 8.5);
  mono(`${String(number).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')}`, 842, y - 1, 66, 9, C.dim, { align: 'right' });
  const barX = 52;
  const gap = 4;
  const totalW = 760;
  const segW = (totalW - gap * (TOTAL - 1)) / TOTAL;
  for (let i = 0; i < TOTAL; i += 1) {
    doc.roundedRect(barX + i * (segW + gap), 529, segW, 3, 1.5).fill(i + 1 <= number ? activeColor : C.line);
  }
}

function beginSlide(number, command, rubric, accent = C.yellow) {
  doc.addPage({ size: [W, H], margin: 0 });
  doc.rect(0, 0, W, H).fill(C.ink);
  drawGrid();
  mono('$', 52, 28, 12, 12, C.green);
  text(command, 68, 28, 560, 12, C.muted, 'Courier-Bold');
  const badgeW = Math.max(118, Math.min(220, rubric.length * 7.1));
  pill(rubric, W - 52 - badgeW, 24, badgeW, accent, C.panel2, 9.5);
  footer(number, accent);
}

function titleBlock(titleValue, subtitleValue, accent = C.yellow, y = 70) {
  let titleSize = 32;
  doc.font('Courier-Bold').fontSize(titleSize);
  while (doc.widthOfString(titleValue) > 856 && titleSize > 26) {
    titleSize -= 1;
    doc.fontSize(titleSize);
  }
  mono(titleValue, 52, y, 856, titleSize, C.white, { lineGap: 0, lineBreak: false });
  doc.roundedRect(52, y + 37, 64, 4, 2).fill(accent);
  if (subtitleValue) text(subtitleValue, 54, y + 48, 846, 14.5, C.muted, 'Helvetica', { lineGap: 3 });
}

function drawMapCrop(imagePath, x, y, width, height, labelValue) {
  doc.save();
  doc.roundedRect(x, y, width, height, 13).clip();
  doc.image(imagePath, x, y, { cover: [width, height], align: 'center', valign: 'center' });
  doc.rect(x, y, width, height).fillOpacity(0.18).fill(C.ink);
  doc.rect(x, y + height - 42, width, 42).fillOpacity(0.9).fill(C.ink);
  doc.fillOpacity(1);
  smallCaps(labelValue, x + 14, y + height - 28, width - 28, C.white, 9);
  doc.restore();
  doc.save().roundedRect(x, y, width, height, 13).strokeColor(C.line).lineWidth(1.2).stroke().restore();
}

function statCard({ x, y, width, accent, value, label, source }) {
  panel(x, y, width, 132, accent);
  mono(value, x + 18, y + 22, width - 36, 28, accent);
  text(label, x + 18, y + 63, width - 36, 13, C.white, 'Helvetica-Bold', { lineGap: 3 });
  sourceTag(source, x + width - 45, y + 103, accent);
}

function quoteCard(value, x, y, width, accent) {
  doc.save().roundedRect(x, y, width, 58, 10).fillAndStroke(C.panel2, C.line);
  doc.circle(x + 18, y + 18, 5).fill(accent);
  text(`“${value}”`, x + 32, y + 12, width - 46, 12.3, C.white, 'Helvetica-Bold', { lineGap: 2 });
  doc.restore();
}

function infoRow(labelValue, body, x, y, width, accent = C.green) {
  smallCaps(labelValue, x, y, width, accent, 9.5);
  text(body, x, y + 18, width, 12.5, C.white, 'Helvetica', { lineGap: 3 });
}

function timelineNode(x, y, width, step, titleValue, body, accent) {
  doc.save().roundedRect(x, y, width, 112, 12).fillAndStroke(C.panel, C.line);
  doc.roundedRect(x, y, width, 5, 2.5).fill(accent);
  smallCaps(step, x + 14, y + 16, width - 28, accent, 8.5);
  mono(titleValue, x + 14, y + 36, width - 28, 16, C.white);
  text(body, x + 14, y + 65, width - 28, 11, C.muted, 'Helvetica', { lineGap: 2 });
  doc.restore();
}

function metricChip(labelValue, value, x, y, width, accent) {
  doc.save().roundedRect(x, y, width, 42, 9).fillAndStroke(C.panel2, C.line);
  smallCaps(labelValue, x + 10, y + 8, width - 20, C.dim, 7.5);
  mono(value, x + 10, y + 21, width - 20, 12, accent);
  doc.restore();
}

function sourceEntry(id, titleValue, detail, url, x, y, width, accent = C.blue) {
  sourceTag(id, x, y, accent);
  text(titleValue, x + 40, y - 1, width - 40, 12.5, C.white, 'Helvetica-Bold');
  text(detail, x + 40, y + 18, width - 40, 10.2, C.muted, 'Helvetica', { lineGap: 2 });
  text(url, x + 40, y + 42, width - 40, 7.8, accent, 'Helvetica', {
    link: url,
    underline: true,
    lineGap: 0,
  });
}

async function render() {
  const qr = await QRCode.toBuffer(REPO_URL, {
    type: 'png',
    width: 360,
    margin: 1,
    color: { dark: C.ink, light: C.white },
    errorCorrectionLevel: 'M',
  });

  // 01 — Title
  beginSlide(1, './owlflow --pitch 5m', 'PITCH · 15', C.yellow);
  doc.save().opacity(0.24);
  drawMapCrop(KENNESAW_MAP, 635, 72, 273, 354, 'Kennesaw campus · live planning surface');
  doc.restore();
  doc.save().rect(600, 52, 340, 400).fillOpacity(0.62).fill(C.ink).restore();
  drawOwlMark(62, 78, 68);
  mono('OWL FLOW', 154, 82, 425, 38, C.white);
  smallCaps('KSU CAMPUS INTELLIGENCE', 156, 126, 390, C.yellow, 10);
  mono('One schedule.', 62, 189, 520, 42, C.white);
  mono('Every campus move.', 62, 237, 540, 42, C.yellow);
  text('AI that coordinates the commute, parking, dining, and laundry around the class that matters next.', 64, 302, 505, 18, C.muted, 'Helvetica', { lineGap: 5 });
  const labels = [
    ['PARK', C.blue],
    ['EAT', C.green],
    ['WASH', C.magenta],
    ['ARRIVE', C.yellow],
  ];
  labels.forEach(([labelValue, color], index) => pill(labelValue, 64 + index * 112, 381, 98, color, C.panel2, 10));
  smallCaps('AI CLUB HACKATHON 2026 · TEAM OWLFLOW', 64, 433, 510, C.dim, 9);
  text('Problem 1:00', 636, 452, 90, 9, C.muted, 'Courier-Bold');
  text('Solution 1:00', 726, 452, 95, 9, C.muted, 'Courier-Bold');
  text('Demo 2:00', 821, 452, 70, 9, C.yellow, 'Courier-Bold');
  doc.roundedRect(636, 471, 255, 5, 2.5).fill(C.line);
  doc.roundedRect(636, 471, 51, 5, 2.5).fill(C.yellow);
  doc.roundedRect(691, 471, 51, 5, 2.5).fill(C.green);
  doc.roundedRect(746, 471, 102, 5, 2.5).fill(C.blue);
  doc.roundedRect(852, 471, 39, 5, 2.5).fill(C.coral);

  // 02 — Problem / campus impact
  beginSlide(2, 'cat campus-friction.log', 'CAMPUS IMPACT · 25', C.green);
  titleBlock('Three queues steal the same scarce thing: time.', 'Parking uncertainty, meal rushes, and shared laundry all collide with fixed class schedules.', C.green);
  statCard({ x: 52, y: 157, width: 268, accent: C.yellow, value: '~11 min', label: 'average time students needed to find campus parking in one university study', source: 2 });
  statCard({ x: 346, y: 157, width: 268, accent: C.green, value: '5–14%', label: 'of food served became plate waste in a university dining-hall study', source: 3 });
  statCard({ x: 640, y: 157, width: 268, accent: C.blue, value: '51,000+', label: 'KSU students who could benefit across two metro Atlanta campuses', source: 1 });
  smallCaps('THE CAMPUS INTERNET, PARAPHRASED', 52, 316, 420, C.dim, 8.5);
  quoteCard('The parking deck is my unofficial first class.', 52, 340, 268, C.yellow);
  quoteCard('I choose lunch by line length, not appetite.', 346, 340, 268, C.green);
  quoteCard('That washer has said “2 min” for 20 min.', 640, 340, 268, C.magenta);
  text('These lines are original comic paraphrases, not survey evidence. The sourced figures above establish the scale of the problem.', 54, 416, 852, 10, C.dim, 'Helvetica-Oblique');
  doc.save().roundedRect(52, 452, 856, 37, 10).fill(C.panel2).strokeColor(C.line).stroke();
  mono('ONE ROOT PROBLEM:', 68, 464, 170, 11, C.green);
  text('students make time-critical decisions with fragmented, stale, or invisible information.', 236, 463, 640, 12.5, C.white, 'Helvetica-Bold');
  doc.restore();

  // 03 — Core solution
  beginSlide(3, './owlflow --plan my-day', 'CORE SOLUTION', C.yellow);
  titleBlock('One schedule becomes one coordinated plan.', 'OwlFlow optimizes the route to campus, the best dining window, and a laundry cycle that fits before class.', C.yellow);
  panel(52, 153, 176, 250, C.blue);
  smallCaps('ONE INPUT', 70, 174, 140, C.blue, 9);
  mono('BIOL 2108', 70, 201, 140, 19, C.white);
  text('12:30 PM · Mon', 70, 228, 140, 12, C.muted, 'Helvetica-Bold');
  rule(70, 258, 140);
  infoRow('ORIGIN', 'Acworth', 70, 273, 140, C.yellow);
  infoRow('PREFERENCES', 'Halal · low walking', 70, 323, 140, C.green);
  infoRow('OPTIONAL', 'Dining + laundry', 70, 373, 140, C.magenta);
  drawArrow(238, 278, 277, 278, C.yellow, 2.5);
  doc.save().circle(349, 278, 72).fill(C.panel2).strokeColor(C.yellow).lineWidth(2.4).stroke();
  drawOwlMark(321, 220, 56);
  mono('PLAN', 310, 292, 80, 18, C.yellow, { align: 'center' });
  text('recompute on every signal', 293, 318, 112, 9.5, C.muted, 'Helvetica', { align: 'center' });
  drawArrow(421, 278, 460, 278, C.yellow, 2.5);
  timelineNode(472, 153, 132, '01 · COMMUTE', 'BEST MODE', 'Drive, Uber, or Big Owl Bus', C.blue);
  timelineNode(616, 153, 132, '02 · DINING', 'BEST WINDOW', 'Queue + menu + class fit', C.green);
  timelineNode(760, 153, 148, '03 · LAUNDRY', 'BEST CYCLE', 'Available machine + finish time', C.magenta);
  doc.save().strokeColor(C.line).lineWidth(1.5).moveTo(538, 278).lineTo(834, 278).stroke().restore();
  metricChip('ROUTE', 'Drive + Park', 472, 302, 132, C.blue);
  metricChip('MEAL', 'Shorter queue', 616, 302, 132, C.green);
  metricChip('WASHER', 'Fits by 12:18', 760, 302, 148, C.magenta);
  doc.save().roundedRect(472, 360, 436, 43, 10).fill(C.panel2).strokeColor(C.line).stroke();
  drawCheck(488, 374, C.green);
  text('One change anywhere triggers a full journey replan.', 514, 371, 370, 13, C.white, 'Helvetica-Bold');
  doc.restore();
  smallCaps('THE PRODUCT PROMISE', 52, 435, 260, C.dim, 8.5);
  mono('LESS GUESSING > MORE ON-TIME MOMENTS', 52, 456, 856, 20, C.yellow);

  // 04 — AI core
  beginSlide(4, 'inspect owlflow.ai.core', 'USE OF AI · 25', C.blue);
  titleBlock('The AI is the decision layer.', 'The same intelligence powers every recommendation, every replan, and the Owl AI explanation.', C.blue);
  panel(52, 151, 244, 264, C.green);
  smallCaps('LIVE + CONTEXT SIGNALS', 70, 172, 205, C.green, 9);
  const inputRows = [
    'Class time + building',
    'Camera stall counts',
    'Traffic, rain + bus load',
    'Menu + dietary needs',
    'Washer availability',
  ];
  inputRows.forEach((row, index) => {
    drawCheck(72, 210 + index * 38, C.green);
    text(row, 96, 207 + index * 38, 176, 12.3, C.white, 'Helvetica-Bold');
  });
  drawArrow(306, 282, 337, 282, C.blue, 2.5);
  panel(348, 151, 266, 264, C.blue);
  smallCaps('OWLFLOW ENGINE', 366, 172, 226, C.blue, 9);
  const engineRows = [
    ['FORECAST', 'Demand by time + scenario'],
    ['SCORE', 'Lateness, cost, walking, load'],
    ['SEE', 'Browser CV at 4 FPS'],
    ['SCHEDULE', 'Meal + laundry around class'],
  ];
  engineRows.forEach(([head, body], index) => {
    mono(head, 366, 207 + index * 47, 90, 10.5, index === 2 ? C.yellow : C.blue);
    text(body, 366, 224 + index * 47, 224, 10.7, C.muted, 'Helvetica');
  });
  drawArrow(624, 282, 655, 282, C.blue, 2.5);
  panel(666, 151, 242, 264, C.yellow);
  smallCaps('EXPLAINABLE ACTIONS', 684, 172, 205, C.yellow, 9);
  const actions = [
    ['MODE', 'Drive / Uber / bus'],
    ['PLACE', 'Deck + open level'],
    ['TIME', 'Meal + washer window'],
    ['WHY', 'Minutes, cost + tradeoff'],
  ];
  actions.forEach(([head, body], index) => {
    mono(head, 684, 207 + index * 47, 62, 10.5, C.yellow);
    text(body, 746, 207 + index * 47, 142, 11, C.white, 'Helvetica-Bold');
  });
  doc.save().roundedRect(52, 438, 856, 51, 11).fill(C.panel2).strokeColor(C.line).stroke();
  pill('FAST LOCAL', 66, 451, 115, C.green, C.ink, 9);
  text('private · deterministic · zero token spend', 194, 456, 270, 11, C.white, 'Helvetica-Bold');
  pill('GEMINI', 485, 451, 92, C.blue, C.ink, 9);
  text('opt-in explanation + vision verification · local fallback', 590, 456, 300, 11, C.white, 'Helvetica-Bold');
  doc.restore();

  // 05 — Demo
  beginSlide(5, './demo --switch-scenarios', 'LIVE DEMO · 2:00', C.coral);
  titleBlock('The plan changes when campus conditions change.', 'Three deterministic scenarios prove that OwlFlow selects a different best move instead of repeating one answer.', C.coral);
  const tableX = 52;
  const tableY = 154;
  const tableW = 540;
  doc.save().roundedRect(tableX, tableY, tableW, 240, 12).fillAndStroke(C.panel, C.line);
  doc.rect(tableX, tableY, tableW, 38).fill(C.panel2);
  smallCaps('CONDITION', tableX + 18, tableY + 14, 160, C.dim, 8);
  smallCaps('BEST MOVE', tableX + 192, tableY + 14, 140, C.dim, 8);
  smallCaps('PROTOTYPE OUTPUT', tableX + 360, tableY + 14, 162, C.dim, 8);
  const rows = [
    { name: 'Normal morning', move: 'DRIVE + PARK', output: '31 min · West · ~93%', color: C.green },
    { name: 'Decks hit 98%', move: 'UBER', output: '28 min · $24–29', color: C.yellow },
    { name: 'Rain + traffic', move: 'BIG OWL BUS', output: '54 min · $0', color: C.blue },
  ];
  rows.forEach((row, index) => {
    const y = tableY + 38 + index * 67;
    if (index > 0) rule(tableX + 12, y, tableW - 24, C.line, 0.8);
    doc.circle(tableX + 22, y + 33, 5).fill(row.color);
    text(row.name, tableX + 37, y + 23, 145, 12.2, C.white, 'Helvetica-Bold');
    mono(row.move, tableX + 192, y + 22, 156, 12.5, row.color);
    text(row.output, tableX + 360, y + 23, 160, 12, C.muted, 'Helvetica-Bold');
  });
  doc.restore();
  drawMapCrop(KENNESAW_MAP, 618, 154, 290, 240, 'Kennesaw parking · project asset');
  doc.save().roundedRect(649, 177, 144, 76, 10).fillOpacity(0.92).fill(C.ink).strokeColor(C.yellow).stroke();
  doc.fillOpacity(1);
  smallCaps('WEST DECK', 663, 190, 112, C.yellow, 8);
  mono('93% FULL', 663, 210, 112, 18, C.white);
  text('CV · 4 FPS', 663, 235, 110, 9, C.green, 'Courier-Bold');
  doc.restore();
  const demoSteps = [
    ['1', 'Switch scenario', C.coral],
    ['2', 'Open camera', C.yellow],
    ['3', 'Push spot count', C.green],
    ['4', 'Ask Owl AI “why?”', C.blue],
  ];
  demoSteps.forEach(([n, labelValue, color], index) => {
    const x = 52 + index * 216;
    doc.circle(x + 16, 439, 16).fill(color);
    mono(n, x + 6, 432, 20, 12, C.ink, { align: 'center' });
    text(labelValue, x + 40, 429, 166, 12.5, C.white, 'Helvetica-Bold');
    if (index < demoSteps.length - 1) drawArrow(x + 194, 439, x + 210, 439, C.line, 1.5);
  });
  text('Backup values are documented prototype outputs; operational campus readings are simulated in this branch. [6]', 54, 474, 850, 9.5, C.dim, 'Helvetica-Oblique');

  // 06 — Creativity
  beginSlide(6, 'git diff ordinary-campus-app', 'CREATIVITY · 15', C.magenta);
  titleBlock('We connected the parts students overlook.', 'The clever part is not another dashboard. It is one plan that understands how small campus delays compound.', C.magenta);
  const creative = [
    {
      x: 52,
      width: 268,
      accent: C.blue,
      number: '01',
      title: 'PARKING',
      now: 'Camera counts can change the entire commute recommendation, not only point to a spot.',
      next: 'Approved deck feeds + edge counts; no raw video storage.',
    },
    {
      x: 346,
      width: 268,
      accent: C.green,
      number: '02',
      title: 'DINING',
      now: 'Queue, menu, dietary preference, walking, and class time become one meal decision.',
      next: 'Aggregate demand forecasts help Dining prep by station and reduce avoidable surplus.',
    },
    {
      x: 640,
      width: 268,
      accent: C.magenta,
      number: '03',
      title: 'LAUNDRY',
      now: 'A washer is recommended only when its cycle fits the student’s schedule.',
      next: 'GroupMe/mobile alerts, dryer handoff, and opt-in lost-and-found notifications.',
    },
  ];
  creative.forEach((item) => {
    panel(item.x, 154, item.width, 286, item.accent);
    mono(item.number, item.x + 18, 176, 48, 13, item.accent);
    mono(item.title, item.x + 18, 204, item.width - 36, 21, C.white);
    smallCaps('BUILT NOW', item.x + 18, 250, item.width - 36, item.accent, 8);
    text(item.now, item.x + 18, 272, item.width - 36, 12.2, C.white, 'Helvetica', { lineGap: 4 });
    rule(item.x + 18, 345, item.width - 36, C.line);
    smallCaps('NEXT', item.x + 18, 362, item.width - 36, C.dim, 8);
    text(item.next, item.x + 18, 382, item.width - 36, 11, C.muted, 'Helvetica', { lineGap: 3 });
  });
  doc.save().roundedRect(52, 458, 856, 31, 9).fill(C.panel2).strokeColor(C.line).stroke();
  text('Preference filters include halal, vegetarian, vegan, and gluten-free. Production must use official menu/allergen controls.', 67, 467, 826, 10.5, C.muted, 'Helvetica-Bold', { align: 'center' });
  doc.restore();

  // 07 — Feasibility
  beginSlide(7, './rollout --campus-ready', 'FEASIBILITY · 20', C.green);
  titleBlock('Start small. Prove it. Then connect both campuses.', 'A staged rollout replaces each simulated adapter with an approved KSU feed while preserving the local-first planner.', C.green);
  const phases = [
    ['NOW', 'Reproducible static demo\nSimulated campus signals', C.dim],
    ['30 DAYS', '1 deck · 1 dining hall\n1 residence hall', C.yellow],
    ['90 DAYS', 'Baseline vs. pilot\nPrivacy + accuracy review', C.green],
    ['SCALE', 'Both campuses\nTransit + ops dashboard', C.blue],
  ];
  phases.forEach(([head, body, color], index) => {
    const x = 52 + index * 216;
    doc.save().roundedRect(x, 151, 196, 94, 11).fillAndStroke(C.panel, C.line);
    doc.roundedRect(x, 151, 196, 5, 2.5).fill(color);
    smallCaps(head, x + 14, 170, index === 3 ? 88 : 168, color, 8.5);
    text(body, x + 14, 193, index === 3 ? 92 : 168, 11.5, C.white, 'Helvetica-Bold', { lineGap: 4 });
    if (index === 3) {
      [
        [KENNESAW_MAP, 166, 'K'],
        [MARIETTA_MAP, 205, 'M'],
      ].forEach(([imagePath, imageY, campus]) => {
        doc.save().roundedRect(x + 116, imageY, 66, 29, 5).clip();
        doc.image(imagePath, x + 116, imageY, { cover: [66, 29], align: 'center', valign: 'center' });
        doc.rect(x + 116, imageY, 66, 29).fillOpacity(0.28).fill(C.ink);
        doc.fillOpacity(1);
        doc.restore();
        doc.roundedRect(x + 116, imageY, 66, 29, 5).strokeColor(C.line).stroke();
        mono(campus, x + 121, imageY + 8, 14, 8, C.white);
      });
    }
    doc.restore();
    if (index < phases.length - 1) drawArrow(x + 198, 198, x + 212, 198, C.line, 1.5);
  });
  panel(52, 274, 268, 171, C.blue);
  smallCaps('DATA PLAN', 70, 295, 230, C.blue, 9);
  text('• Camera → occupancy counts at the edge\n• Official menu + station updates\n• Laundry vendor status + Passio links', 70, 323, 228, 12, C.white, 'Helvetica', { lineGap: 6 });
  text('Transmit counts and events, not stored video.', 70, 410, 228, 10, C.muted, 'Helvetica-Oblique');
  panel(346, 274, 268, 171, C.yellow);
  smallCaps('COST PLAN', 364, 295, 230, C.yellow, 9);
  mono('$0 TOKENS', 364, 322, 230, 18, C.white);
  text('for Fast Local planning', 364, 345, 230, 10.5, C.muted, 'Helvetica-Bold');
  mono('~$0.90 / DAY*', 364, 370, 230, 18, C.yellow);
  text('for 5,000 short Flash-Lite requests; hosting and video traffic separate', 364, 394, 228, 10, C.muted, 'Helvetica', { lineGap: 2 });
  panel(640, 274, 268, 171, C.green);
  smallCaps('SAFEGUARDS', 658, 295, 230, C.green, 9);
  text('• Server-side model key + quotas\n• Opt-in location and vision\n• No face recognition\n• Preference aid, not allergen guarantee', 658, 323, 228, 11.8, C.white, 'Helvetica', { lineGap: 5 });
  text('*Assumes 1,000 input + 200 output tokens/request at $0.10/$0.40 per 1M tokens. [5]', 54, 462, 852, 9.2, C.dim, 'Helvetica-Oblique');
  text('KSU added or converted almost 600 student parking spaces for Fall 2026, showing active mobility investment. [4]', 54, 478, 852, 9.2, C.dim, 'Helvetica-Oblique');

  // 08 — Impact + close
  beginSlide(8, './launch --pilot ksu', 'PITCH · 15', C.yellow);
  titleBlock('Give every Owl the best next move.', 'Measure the time, demand, and waste outcomes before expanding beyond a focused 90-day pilot.', C.yellow);
  panel(52, 151, 250, 258, C.yellow);
  smallCaps('POTENTIAL REACH', 72, 174, 210, C.yellow, 9);
  mono('51K+', 72, 205, 210, 50, C.white);
  text('students across two KSU campuses [1]', 72, 263, 200, 14, C.muted, 'Helvetica-Bold', { lineGap: 4 });
  rule(72, 311, 210);
  smallCaps('PILOT ASK', 72, 330, 210, C.green, 9);
  text('Approved data access + one deck + one dining hall + one residence hall.', 72, 354, 200, 12.2, C.white, 'Helvetica-Bold', { lineGap: 4 });
  panel(326, 151, 370, 258, C.green);
  smallCaps('SUCCESS = BEFORE > AFTER', 346, 174, 330, C.green, 9);
  const kpis = [
    ['STUDENT TIME', 'parking search · dining wait · laundry trips'],
    ['ON-TIME RATE', 'arrival slack before the next class'],
    ['OPERATIONS', 'demand forecast error · peak distribution'],
    ['FOOD WASTE', 'overproduction by dining station'],
  ];
  kpis.forEach(([head, body], index) => {
    const y = 210 + index * 44;
    mono(head, 346, y, 112, 9.5, index === 3 ? C.yellow : C.green);
    text(body, 461, y - 1, 214, 10.8, C.white, 'Helvetica-Bold');
  });
  doc.save().roundedRect(724, 151, 184, 184, 14).fill(C.white);
  doc.image(qr, 741, 168, { fit: [150, 150] });
  doc.restore();
  smallCaps('SCAN THE BUILD', 724, 349, 184, C.yellow, 8.5, { align: 'center' });
  text('github.com/Final-Eclipse/owlflow', 724, 371, 184, 8.8, C.blue, 'Helvetica-Bold', {
    align: 'center',
    link: REPO_URL,
    underline: true,
  });
  doc.save().roundedRect(52, 438, 856, 52, 12).fill(C.yellow);
  mono('OWL FLOW', 72, 453, 150, 19, C.ink);
  mono('LESS GUESSING. MORE LIVING.', 224, 453, 664, 19, C.ink, { align: 'right' });
  doc.restore();

  // 09 — Sources + boundaries
  beginSlide(9, 'cat sources.md', 'APPENDIX · SOURCES', C.blue);
  titleBlock('Sources & claim boundaries', 'External findings are paraphrased. Prototype outputs are labeled as simulated or deterministic.', C.blue);
  sourceEntry(1, 'Kennesaw State University — About KSU', 'Current institutional description: more than 51,000 students across two metro Atlanta campuses.', SOURCES.ksu, 52, 149, 410, C.blue);
  sourceEntry(2, 'Utah Valley University — Parking and Pedestrians', 'Student research reported an average of about 11 minutes to find a campus parking space.', SOURCES.parkingStudy, 52, 229, 410, C.yellow);
  sourceEntry(3, 'University of Maryland — Dining-hall food waste research', 'Study reported plate waste equal to 5%–14% of food served.', SOURCES.foodWaste, 52, 309, 410, C.green);
  sourceEntry(4, 'KSU — Fall 2026 parking and bus expansion', 'KSU reported almost 600 student spaces added or converted across both campuses.', SOURCES.ksuParking, 52, 389, 410, C.coral);
  panel(506, 149, 402, 320, C.blue);
  sourceEntry(5, 'Google AI Studio — Gemini API pricing', 'Flash-Lite standard paid tier used for the illustrative pilot calculation; pricing snapshot: Nov. 20, 2026.', SOURCES.geminiPricing, 526, 171, 360, C.blue);
  sourceEntry(6, 'OwlFlow repository and README', 'Source for the architecture, demo outputs, feature inventory, simulation disclosures, and project assets.', REPO_URL, 526, 251, 360, C.yellow);
  sourceEntry(7, 'AI Club Hackathon 2026 opening ceremony', 'User-provided slide 22: campus impact 25, AI 25, feasibility 20, creativity 15, pitch 15.', '', 526, 331, 360, C.green);
  rule(526, 407, 360, C.line);
  smallCaps('PROTOTYPE BOUNDARY', 526, 422, 360, C.coral, 8.5);
  text('The branch proves local planning, scenario switching, browser CV, schedule-aware dining/laundry logic, maps, and Owl AI. Live KSU feeds, production notifications, and operations forecasting remain rollout work.', 526, 442, 360, 9.4, C.muted, 'Helvetica', { lineGap: 2 });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  const stat = fs.statSync(OUT);
  console.log(`Generated ${OUT}`);
  console.log(`Size: ${stat.size} bytes`);
}

render().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
