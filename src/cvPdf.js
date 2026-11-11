// US-05 – CV-г PDF болгон үүсгэх (PDFKit). Кирилл үсэгт DejaVu Sans фонт ашиглана.
const path = require('path');
const PDFDocument = require('pdfkit');

const FONT_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const REGULAR = path.join(FONT_DIR, 'DejaVuSans.ttf');
const BOLD = path.join(FONT_DIR, 'DejaVuSans-Bold.ttf');

const DEGREES = { BACHELOR: 'Бакалавр', MASTER: 'Магистр', DOCTOR: 'Доктор', DIPLOMA: 'Диплом' };

function period(start, end) {
  const fmt = (d) => (d ? String(d).slice(0, 7).replace('-', '.') : '');
  return `${fmt(start) || '—'} – ${end ? fmt(end) : 'одоо'}`;
}

/**
 * @param {object} snapshot cvs.snapshot (buildCvSnapshot-ийн үр дүн)
 * @returns {Promise<Buffer>}
 */
function renderCvPdf(snapshot) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56, info: { Title: `CV — ${snapshot.profile.fullName}` } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('regular', REGULAR);
    doc.registerFont('bold', BOLD);
    const { profile, educations = [], experiences = [], skills = [] } = snapshot;

    doc.font('bold').fontSize(22).fillColor('#111111').text(profile.fullName);
    doc.font('regular').fontSize(11).fillColor('#52525B').text(profile.profession || 'Мэргэжил оруулаагүй');
    const contacts = [profile.email, profile.phone].filter(Boolean).join('  ·  ');
    if (contacts) doc.moveDown(0.2).text(contacts);

    const section = (title) => {
      doc.moveDown(1.2).font('bold').fontSize(12).fillColor('#111111').text(title.toUpperCase(), { characterSpacing: 0.5 });
      const y = doc.y + 3;
      doc.moveTo(56, y).lineTo(539, y).lineWidth(0.7).strokeColor('#D4D4D8').stroke();
      doc.moveDown(0.6);
    };

    if (profile.summary) {
      section('Товч танилцуулга');
      doc.font('regular').fontSize(10.5).fillColor('#27272A').text(profile.summary, { lineGap: 2 });
    }

    section('Боловсрол');
    if (educations.length === 0) doc.font('regular').fontSize(10.5).fillColor('#71717A').text('Мэдээлэл оруулаагүй');
    for (const e of educations) {
      doc.font('bold').fontSize(11).fillColor('#111111').text(`${e.school}`, { continued: true })
        .font('regular').fillColor('#71717A').text(`   ${period(e.startDate, e.graduationDate)}`);
      doc.font('regular').fontSize(10.5).fillColor('#27272A').text(`${DEGREES[e.degree] || e.degree} · ${e.major}`).moveDown(0.5);
    }

    section('Ажлын туршлага');
    if (experiences.length === 0) doc.font('regular').fontSize(10.5).fillColor('#71717A').text('Мэдээлэл оруулаагүй');
    for (const x of experiences) {
      doc.font('bold').fontSize(11).fillColor('#111111').text(`${x.position} — ${x.companyName}`, { continued: true })
        .font('regular').fillColor('#71717A').text(`   ${period(x.startDate, x.endDate)}`);
      if (x.description) doc.font('regular').fontSize(10.5).fillColor('#27272A').text(x.description, { lineGap: 2 });
      doc.moveDown(0.5);
    }

    section('Ур чадвар');
    const list = skills.map((s) => (s.level ? `${s.name} (${s.level}/5)` : s.name)).join('   ·   ');
    doc.font('regular').fontSize(10.5).fillColor('#27272A').text(list || 'Мэдээлэл оруулаагүй', { lineGap: 3 });

    doc.moveDown(2).font('regular').fontSize(8.5).fillColor('#A1A1AA')
      .text(`CareerBridge-ээр үүсгэсэн · ${String(snapshot.generatedAt).slice(0, 10)}`);
    doc.end();
  });
}

module.exports = { renderCvPdf, DEGREES };
