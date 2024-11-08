const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateTripPDF(trip, callback) {
    const doc = new PDFDocument();
    const filePath = `./tmp/trip_${trip._id}.pdf`;

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text(trip.title, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Descripción: ${trip.description}`);
    doc.moveDown();

    // falta agregar aqui los detalles mas importantes del trip

    doc.end();

    doc.on('finish', () => {
        callback(filePath);
    });
}

module.exports = generateTripPDF;