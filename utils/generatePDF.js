const PDFDocument = require('pdfkit');

const formatDate = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');

// Escribe el PDF del itinerario directamente en `stream` (p. ej. la respuesta HTTP).
function generateTripPDF(trip, stream) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    doc.fontSize(20).text(trip.title || 'Itinerario', { align: 'center' });
    doc.moveDown();

    if (trip.description) {
        doc.fontSize(12).text(`Descripción: ${trip.description}`);
    }
    if (trip.travelDates?.startDate && trip.travelDates?.endDate) {
        doc.fontSize(12).text(`Fechas: ${formatDate(trip.travelDates.startDate)} - ${formatDate(trip.travelDates.endDate)}`);
    }
    doc.moveDown();

    const itinerary = trip.itinerary || {};
    const dayKeys = Object.keys(itinerary).sort(
        (a, b) => (parseInt(a.replace(/\D/g, ''), 10) || 0) - (parseInt(b.replace(/\D/g, ''), 10) || 0)
    );

    dayKeys.forEach((dayKey, index) => {
        const day = itinerary[dayKey] || {};
        doc.fontSize(15).text(`Día ${index + 1}${day.fecha ? ` - ${day.fecha}` : ''}`);
        doc.moveDown(0.3);

        (Array.isArray(day.actividades) ? day.actividades : []).forEach((activity) => {
            const place = activity['ubicación'] || activity.ubicacion;
            doc.fontSize(11).text(`${activity.hora || ''}  ${activity.actividad || ''}${place ? ` (${place})` : ''}`);
        });

        if (day.alojamiento) {
            doc.moveDown(0.3);
            doc.fontSize(11).text(`Alojamiento: ${day.alojamiento}`);
        }
        if (day.transporte) {
            doc.fontSize(11).text(`Transporte: ${day.transporte}`);
        }
        doc.moveDown();
    });

    doc.end();
}

module.exports = generateTripPDF;
