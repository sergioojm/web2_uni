import PDFDocument from 'pdfkit';

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '-');

export const generateDeliveryNotePdf = (note) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('Albarán', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10);
      doc.text(`ID: ${note._id}`);
      doc.text(`Fecha trabajo: ${fmt(note.workDate)}`);
      doc.text(`Formato: ${note.format}`);
      doc.moveDown();

      doc.fontSize(12).text('Usuario', { underline: true });
      doc.fontSize(10).text(`${note.user?.email || ''}`);
      if (note.user?.name) doc.text(`${note.user.name} ${note.user.lastName || ''}`);
      doc.moveDown();

      doc.fontSize(12).text('Cliente', { underline: true });
      doc.fontSize(10).text(`${note.client?.name || ''} (${note.client?.cif || ''})`);
      doc.moveDown();

      doc.fontSize(12).text('Proyecto', { underline: true });
      doc
        .fontSize(10)
        .text(`${note.project?.name || ''} — ${note.project?.projectCode || ''}`);
      doc.moveDown();

      doc.fontSize(12).text('Detalle', { underline: true });
      doc.fontSize(10);
      if (note.format === 'material') {
        doc.text(`Material: ${note.material}`);
        doc.text(`Cantidad: ${note.quantity} ${note.unit || ''}`);
      } else {
        if (note.hours != null) doc.text(`Horas totales: ${note.hours}`);
        if (note.workers?.length) {
          doc.text('Trabajadores:');
          note.workers.forEach((w) => doc.text(`  • ${w.name}: ${w.hours}h`));
        }
      }
      if (note.description) {
        doc.moveDown();
        doc.text(`Descripción: ${note.description}`);
      }

      doc.moveDown(2);
      if (note.signed) {
        doc.fontSize(12).text(`Firmado el ${fmt(note.signedAt)}`);
        if (note.signatureUrl) {
          doc.fontSize(8).text(`Firma: ${note.signatureUrl}`);
        }
      } else {
        doc.fontSize(12).text('Pendiente de firma');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
