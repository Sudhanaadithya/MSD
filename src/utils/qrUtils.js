/**
 * QR Code Utilities — Smart Rental Track
 * ========================================
 * Generate and parse QR codes for rental booking handover.
 */

import QRCode from 'qrcode';

/**
 * Generate a QR code data URL from booking data.
 * @param {object} bookingData - { bookingId, equipmentId, customerEmail, ... }
 * @returns {Promise<string>} - Base64 data URL of the QR code image
 */
export async function generateBookingQR(bookingData) {
  const qrPayload = JSON.stringify({
    booking_id: bookingData.bookingId || bookingData.id,
    equipment_id: bookingData.equipmentId,
    customer: bookingData.customerEmail || bookingData.customer,
    ts: Date.now(),
    type: 'rental_handover',
  });

  try {
    const dataUrl = await QRCode.toDataURL(qrPayload, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1c1b1b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('QR generation failed:', err);
    // Return a placeholder if QR generation fails
    return null;
  }
}

/**
 * Parse scanned QR data back to a booking reference.
 * @param {string} qrString - Raw QR code content (JSON string)
 * @returns {{ booking_id: string, equipment_id: string, customer: string, ts: number, type: string } | null}
 */
export function parseBookingQR(qrString) {
  try {
    const parsed = JSON.parse(qrString);
    if (parsed.type === 'rental_handover' && parsed.booking_id) {
      return parsed;
    }
    // Try to handle plain booking ID strings
    return { booking_id: qrString, type: 'rental_handover' };
  } catch {
    // Not JSON — treat as plain booking ID
    if (qrString && qrString.trim()) {
      return { booking_id: qrString.trim(), type: 'rental_handover' };
    }
    return null;
  }
}

/**
 * Generate a unique booking ID.
 * @returns {string}
 */
export function generateBookingId() {
  const prefix = 'BK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
