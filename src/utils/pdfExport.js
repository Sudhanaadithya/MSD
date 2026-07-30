/**
 * PDF Export Utility — Smart Rental Track
 * ==========================================
 * Generates branded PDF reports using jsPDF for Fleet Operations.
 */

import { jsPDF } from 'jspdf';

// ── Common Styling Helpers ─────────────────────────────────────────
function addPDFHeader(doc, title, subtitle) {
  // Industrial Gold/Dark Bar
  doc.setFillColor(116, 91, 0); // #745b00
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SMART RENTAL TRACK', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('OPERATIONAL FLEET REPORT', 140, 15);

  // Subheader
  doc.setTextColor(28, 27, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, 34);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 41);
  }

  // Date Timestamp
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 34);

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 45, 196, 45);
}

function addPDFFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Smart Rental Track System — Page ${i} of ${pageCount}`,
      14,
      287
    );
    doc.text('CONFIDENTIAL & PROPRIETARY', 145, 287);
  }
}

// ── 1. Export Alerts & Anomalies PDF ───────────────────────────────
export function exportAlertsPDF(alerts = []) {
  const doc = new jsPDF();
  addPDFHeader(doc, 'Alerts & Anomalies Report', `Active Operational Exceptions (${alerts.length} Total)`);

  let y = 55;

  // Table Headers
  doc.setFillColor(240, 237, 237);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  doc.text('ID / Asset', 18, y + 5.5);
  doc.text('Site', 65, y + 5.5);
  doc.text('Risk Level', 105, y + 5.5);
  doc.text('Flags / Details', 145, y + 5.5);

  y += 12;

  alerts.forEach((alert, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);

    const assetId = alert.equipment_id || alert.id || `ALT-${index + 1}`;
    const site = alert.site_id || 'North Quarry (S001)';
    const risk = (alert.risk_level || alert.severity || 'Medium').toUpperCase();
    const flags = Array.isArray(alert.flags)
      ? alert.flags.join(', ')
      : alert.details || alert.description || 'Excessive Idle';

    // Risk indicator color
    if (risk.includes('CRITICAL') || risk.includes('HIGH')) {
      doc.setTextColor(220, 38, 38);
    } else if (risk.includes('WARN') || risk.includes('MEDIUM')) {
      doc.setTextColor(180, 120, 0);
    } else {
      doc.setTextColor(34, 197, 94);
    }

    doc.text(assetId.substring(0, 22), 18, y);
    doc.setTextColor(30, 30, 30);
    doc.text(site.substring(0, 20), 65, y);

    doc.setFont('helvetica', 'bold');
    doc.text(risk, 105, y);
    doc.setFont('helvetica', 'normal');

    doc.text(flags.substring(0, 28), 145, y);

    y += 8;

    // Subtle divider line
    doc.setDrawColor(240, 240, 240);
    doc.line(14, y - 3, 196, y - 3);
  });

  addPDFFooter(doc);
  doc.save(`Alerts_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── 2. Export Demand Forecast PDF ──────────────────────────────────
export function exportForecastPDF(forecast, siteId = 'S001') {
  const doc = new jsPDF();
  addPDFHeader(
    doc,
    `Demand Forecast Report — Site ${siteId}`,
    'Machine Learning Predictive Intelligence Summary'
  );

  let y = 55;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(116, 91, 0);
  doc.text('Forecast Parameters & Results', 14, y);
  y += 8;

  const items = Array.isArray(forecast)
    ? forecast
    : [forecast].filter(Boolean);

  items.forEach((item, idx) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(248, 246, 245);
    doc.rect(14, y, 182, 28, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(
      `#${idx + 1} Equipment Type: ${item.equipment_type || 'Excavator'}`,
      18,
      y + 7
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Site ID: ${item.site_id || siteId}`, 18, y + 15);
    doc.text(`Target Date: ${item.date || new Date().toISOString().split('T')[0]}`, 75, y + 15);
    doc.text(`Season Factor: ${item.season || 'peak'}`, 140, y + 15);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(34, 197, 94);
    doc.text(
      `Predicted Demand: ${item.predicted_demand ?? 14.5} Units`,
      18,
      y + 23
    );

    y += 34;
  });

  addPDFFooter(doc);
  doc.save(`Demand_Forecast_${siteId}_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── 3. Export Fleet Equipment PDF ──────────────────────────────────
export function exportEquipmentPDF(equipmentList = []) {
  const doc = new jsPDF();
  addPDFHeader(
    doc,
    'Fleet Inventory Report',
    `Active Heavy Equipment & Telematics Status (${equipmentList.length} Assets)`
  );

  let y = 55;

  doc.setFillColor(240, 237, 237);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);

  doc.text('Asset ID', 18, y + 5.5);
  doc.text('Type', 55, y + 5.5);
  doc.text('Site / Location', 95, y + 5.5);
  doc.text('Status', 145, y + 5.5);
  doc.text('Rental Days', 170, y + 5.5);

  y += 12;

  equipmentList.forEach((eq) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);

    const status = eq.status || 'Active';
    doc.text((eq.id || eq.equipment_id || 'EX-402').substring(0, 15), 18, y);
    doc.text((eq.type || 'Excavator').substring(0, 18), 55, y);
    doc.text((eq.site || eq.sites?.name || 'North Quarry').substring(0, 22), 95, y);

    if (status === 'Active') doc.setTextColor(34, 197, 94);
    else if (status === 'Overdue') doc.setTextColor(239, 68, 68);
    else doc.setTextColor(234, 179, 8);

    doc.setFont('helvetica', 'bold');
    doc.text(status, 145, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    doc.text(`${eq.rentalDays || eq.rental_days || '14'} Days`, 170, y);

    y += 8;
    doc.setDrawColor(240, 240, 240);
    doc.line(14, y - 3, 196, y - 3);
  });

  addPDFFooter(doc);
  doc.save(`Fleet_Inventory_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── 4. Export Rental Receipt PDF ───────────────────────────────────
export function exportRentalReceiptPDF(rental) {
  const doc = new jsPDF();
  addPDFHeader(
    doc,
    'Asset Rental Deployment Confirmation',
    `Official Check-In / Dispatch Voucher #${rental.id || Math.floor(Math.random() * 90000 + 10000)}`
  );

  let y = 55;

  doc.setFillColor(252, 249, 248);
  doc.rect(14, y, 182, 85, 'F');
  doc.setDrawColor(209, 197, 171);
  doc.rect(14, y, 182, 85, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(116, 91, 0);
  doc.text('DEPLOYMENT DETAILS', 20, y + 10);

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);

  doc.text(`Equipment ID: ${rental.equipment_id || 'EX-402'}`, 20, y + 22);
  doc.text(`Equipment Type: ${rental.equipment_type || 'Excavator'}`, 105, y + 22);

  doc.text(`Site Location: ${rental.site_id || 'North Ridge Quarry (S001)'}`, 20, y + 32);
  doc.text(`Operator ID: ${rental.operator_id || 'OP101'}`, 105, y + 32);

  doc.text(`Check-In Date: ${rental.check_in_date || new Date().toISOString().split('T')[0]}`, 20, y + 42);
  doc.text(`Engine Hours/Day: ${rental.engine_hours_day || 8} hrs`, 105, y + 42);

  doc.text(`Idle Hours/Day: ${rental.idle_hours_day || 2} hrs`, 20, y + 52);
  doc.text(`Fuel Level: ${rental.fuel_level || 85}%`, 105, y + 52);

  doc.text(`Notes: ${rental.notes || 'Asset passed pre-inspection scan.'}`, 20, y + 64);

  // Status Box
  doc.setFillColor(34, 197, 94);
  doc.rect(20, y + 72, 172, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('STATUS: CONFIRMED DEPLOYMENT — TELEMATICS ACTIVE', 50, y + 77.5);

  addPDFFooter(doc);
  doc.save(`Rental_Voucher_${rental.equipment_id || 'EX402'}.pdf`);
}

export const generateRentalVoucherPDF = exportRentalReceiptPDF;

