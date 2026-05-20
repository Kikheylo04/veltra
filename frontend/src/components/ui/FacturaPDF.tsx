import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function generarFacturaPDF(factura: any) {
  const doc = new jsPDF();
  const orden = factura.orden;
  const cliente = orden?.vehiculo?.cliente;
  const vehiculo = orden?.vehiculo;

  // Encabezado
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('VELTRA', 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Taller Mecánico', 14, 27);

  // Línea separadora
  doc.setDrawColor(200);
  doc.line(14, 32, 196, 32);

  // Datos factura
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`FACTURA #${factura.id}`, 140, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`Fecha: ${format(new Date(factura.fecha), 'dd/MM/yyyy', { locale: es })}`, 140, 27, { align: 'right' });
  doc.text(`OT #${factura.ordenId}`, 140, 33, { align: 'right' });

  // Info cliente
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 14, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(cliente?.nombre || '-', 14, 52);
  if (cliente?.telefono) doc.text(`Tel: ${cliente.telefono}`, 14, 58);
  if (cliente?.correo) doc.text(`Email: ${cliente.correo}`, 14, 64);

  // Info vehículo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('VEHÍCULO', 110, 45);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${vehiculo?.placa} — ${vehiculo?.marca} ${vehiculo?.modelo}`, 110, 52);
  if (vehiculo?.anio) doc.text(`Año: ${vehiculo.anio}`, 110, 58);

  // Servicios
  const servicios = orden?.servicios ?? [];
  const repuestos = orden?.repuestos ?? [];
  let startY = 80;

  if (servicios.length) {
    autoTable(doc, {
      startY,
      head: [['Descripción del servicio', 'Mano de obra']],
      body: servicios.map((s: any) => [s.descripcion, `$${Number(s.costoManoObra).toFixed(2)}`]),
      headStyles: { fillColor: [30, 64, 175] },
      columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
    });
    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  if (repuestos.length) {
    autoTable(doc, {
      startY,
      head: [['Repuesto', 'Cant.', 'Precio unit.', 'Subtotal']],
      body: repuestos.map((r: any) => [
        r.repuesto?.nombre || '-',
        r.cantidad,
        `$${Number(r.precioUnitario).toFixed(2)}`,
        `$${(r.cantidad * Number(r.precioUnitario)).toFixed(2)}`,
      ]),
      headStyles: { fillColor: [30, 64, 175] },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Totales
  const totalesY = startY + 5;
  doc.setDrawColor(200);
  doc.line(120, totalesY, 196, totalesY);
  doc.setFontSize(10);
  doc.text('Subtotal:', 130, totalesY + 8);
  doc.text(`$${Number(factura.subtotal).toFixed(2)}`, 196, totalesY + 8, { align: 'right' });
  doc.text('Impuesto:', 130, totalesY + 15);
  doc.text(`$${Number(factura.impuesto).toFixed(2)}`, 196, totalesY + 15, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', 130, totalesY + 24);
  doc.text(`$${Number(factura.total).toFixed(2)}`, 196, totalesY + 24, { align: 'right' });

  // Método de pago y estado
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Método de pago: ${factura.metodoPago}`, 14, totalesY + 24);
  doc.text(`Estado: ${factura.pagado ? 'PAGADA' : 'PENDIENTE'}`, 14, totalesY + 31);

  // Pie de página
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Gracias por confiar en VELTRA Taller Mecánico.', 105, 285, { align: 'center' });

  doc.save(`Factura-${factura.id}.pdf`);
}
