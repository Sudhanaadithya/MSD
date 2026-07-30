import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  getEquipmentList,
  getBookings,
  createBooking as dbCreateBooking,
  updateBookingStatus as dbUpdateBookingStatus,
  getNotifications,
  createNotification as dbCreateNotification,
  getDrivers,
  getComplaints,
  createComplaint as dbCreateComplaint,
  seedCloudDatabase,
} from '../services/database';
import { generateBookingQR, generateBookingId } from '../utils/qrUtils';
import { publishKafkaEvent, KAFKA_TOPICS } from '../services/kafkaService';

export const RentalContext = createContext({});

export const RentalProvider = ({ children }) => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // Attempt cloud database seeding if tables are active
        await seedCloudDatabase();

        const [eqData, bkData, notifData, drvData, cmpData] = await Promise.all([
          getEquipmentList(),
          getBookings(),
          getNotifications(),
          getDrivers(),
          getComplaints(),
        ]);
        setEquipmentList(eqData || []);
        setBookings(bkData || []);
        setNotifications(notifData || []);
        setDrivers(drvData || []);
        setComplaints(cmpData || []);
      } catch (err) {
        console.error('Failed to load rental store data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Add a new booking (Customer flow)
  const addBooking = async (bookingPayload) => {
    const bookingId = generateBookingId();
    const qrCode = await generateBookingQR({
      bookingId,
      equipmentId: bookingPayload.equipment_id,
      customerEmail: bookingPayload.customer_email,
    });

    const newBooking = {
      booking_id: bookingId,
      id: bookingId,
      equipment_id: bookingPayload.equipment_id,
      customer_id: bookingPayload.customer_id || 'usr_customer',
      customer_name: bookingPayload.customer_name || 'Valued Customer',
      customer_email: bookingPayload.customer_email || 'customer@client.com',
      jobsite: bookingPayload.jobsite,
      start_date: bookingPayload.start_date,
      end_date: bookingPayload.end_date,
      transportation_type: bookingPayload.transportation_type,
      estimated_cost: bookingPayload.estimated_cost,
      agreement_accepted: true,
      agreement_timestamp: new Date().toISOString(),
      license_number: bookingPayload.license_number,
      weather_confirmed: bookingPayload.weather_confirmed || false,
      status: 'PENDING_EMPLOYEE_SCAN', // Requires Employee Camera QR Scan to Accept
      qr_code: qrCode,
      driver_id: null,
      created_at: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    await dbCreateBooking(newBooking);

    // Publish Kafka Event
    publishKafkaEvent(KAFKA_TOPICS.RENTAL_CHECKIN, {
      booking_id: bookingId,
      equipment_id: newBooking.equipment_id,
      customer_email: newBooking.customer_email,
      status: 'PENDING_EMPLOYEE_SCAN',
      msg: `Customer booking created ${bookingId} — awaiting employee camera scan`,
    });

    if (bookingPayload.transportation_type === 'delivery') {
      const newNotif = {
        notification_id: `NOTIF-${Date.now()}`,
        id: `NOTIF-${Date.now()}`,
        type: 'delivery_request',
        booking_id: bookingId,
        customer_name: newBooking.customer_name,
        equipment_id: newBooking.equipment_id,
        jobsite: newBooking.jobsite,
        start_date: newBooking.start_date,
        end_date: newBooking.end_date,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      await dbCreateNotification(newNotif);
    }

    return newBooking;
  };

  // Perform QR Handover (Employee side)
  const processQRHandover = (scannedBookingId) => {
    const booking = bookings.find(
      (b) => (b.booking_id === scannedBookingId || b.id === scannedBookingId)
    );

    if (!booking) {
      return { success: false, message: `No booking found matching QR Code: ${scannedBookingId}` };
    }

    if (booking.status === 'HANDOVER_ACCEPTED' || booking.status === 'active') {
      return { success: false, message: `Booking ${booking.booking_id} has ALREADY been scanned and accepted by an employee.` };
    }

    // Update booking status to "HANDOVER_ACCEPTED"
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === booking.booking_id || b.id === booking.booking_id
          ? { ...b, status: 'HANDOVER_ACCEPTED', accepted_at: new Date().toISOString() }
          : b
      )
    );

    // Update equipment status to "In Use"
    setEquipmentList((prev) =>
      prev.map((eq) =>
        eq.equipment_id === booking.equipment_id || eq.id === booking.equipment_id
          ? { ...eq, status: 'In Use' }
          : eq
      )
    );

    dbUpdateBookingStatus(booking.booking_id, 'HANDOVER_ACCEPTED');

    // Publish Kafka Event
    publishKafkaEvent(KAFKA_TOPICS.RENTAL_CHECKIN, {
      booking_id: booking.booking_id,
      equipment_id: booking.equipment_id,
      status: 'HANDOVER_ACCEPTED',
      accepted_by: 'Caterpillar Employee Camera Scan',
      msg: `✅ QR Code verified & ACCEPTED by employee camera scan for booking ${booking.booking_id}`,
    });

    return {
      success: true,
      booking,
      message: `✅ QR Code Verified & Accepted! Booking ${booking.booking_id} activated. Equipment ${booking.equipment_id} released to customer.`,
    };
  };

  // Assign Driver to Delivery Notification (Employee side - Section 7.3)
  const assignDriverToDelivery = (notificationId, driverId) => {
    const notif = notifications.find((n) => n.notification_id === notificationId || n.id === notificationId);
    const driver = drivers.find((d) => d.driver_id === driverId);

    if (!notif || !driver) return false;

    // Update driver to Assigned
    setDrivers((prev) =>
      prev.map((d) =>
        d.driver_id === driverId
          ? { ...d, status: 'assigned', assigned_booking_id: notif.booking_id }
          : d
      )
    );

    // Update notification status to Driver Assigned
    setNotifications((prev) =>
      prev.map((n) =>
        (n.notification_id === notificationId || n.id === notificationId)
          ? { ...n, status: 'driver_assigned', assigned_driver: driver.name }
          : n
      )
    );

    // Update booking record with assigned driver
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === notif.booking_id ? { ...b, driver_id: driverId } : b
      )
    );

    return true;
  };

  // Submit Complaint (Customer side - Section 8.2)
  const addComplaint = async (complaintPayload) => {
    const newComplaint = {
      complaint_id: `CMP-${Date.now()}`,
      id: `CMP-${Date.now()}`,
      customer_id: complaintPayload.customer_id || 'usr_customer',
      customer_name: complaintPayload.customer_name || 'Valued Customer',
      booking_id: complaintPayload.booking_id,
      equipment_id: complaintPayload.equipment_id,
      category: complaintPayload.category,
      description: complaintPayload.description,
      status: 'open', // open | in_progress | resolved
      created_at: new Date().toISOString(),
    };

    setComplaints((prev) => [newComplaint, ...prev]);
    await dbCreateComplaint(newComplaint);
    return newComplaint;
  };

  // Update Complaint Status (Employee side - Section 7.4)
  const updateComplaintStatus = (complaintId, newStatus) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.complaint_id === complaintId || c.id === complaintId
          ? { ...c, status: newStatus }
          : c
      )
    );
  };

  return (
    <RentalContext.Provider
      value={{
        equipmentList,
        bookings,
        notifications,
        drivers,
        complaints,
        loading,
        addBooking,
        processQRHandover,
        assignDriverToDelivery,
        addComplaint,
        updateComplaintStatus,
      }}
    >
      {children}
    </RentalContext.Provider>
  );
};

export const useRental = () => useContext(RentalContext);
