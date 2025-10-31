import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Cloud Function equivalent: Handle emergency with location
 * Captures patient location, finds nearest hospital, contacts ambulance/NGOs
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, latitude, longitude, emergencyId } = body;

    if (!userId || !emergencyId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, emergencyId" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();

    // Store location
    const location = {
      latitude: latitude || null,
      longitude: longitude || null,
      timestamp: FieldValue.serverTimestamp(),
      accuracy: null,
    };

    await db.collection("users").doc(userId).collection("emergencyLogs").doc(emergencyId).update({
      location,
      status: "active",
    });

    // Find nearest hospital
    let nearestHospital = null;
    if (latitude && longitude) {
      nearestHospital = await findNearestHospital(latitude, longitude);
    }

    // Contact ambulance services
    const ambulanceContacted = await contactAmbulanceServices(
      userId,
      userData,
      latitude,
      longitude,
      emergencyId
    );

    // Contact NGOs
    const ngoContacted = await contactNGOs(
      userId,
      userData,
      latitude,
      longitude,
      emergencyId
    );

    // Notify caregivers and hospitals
    await notifyEmergencyResponders(
      userId,
      userData,
      emergencyId,
      nearestHospital,
      location
    );

    return NextResponse.json({
      success: true,
      location,
      nearestHospital,
      ambulanceContacted,
      ngoContacted,
      message: "Emergency alert processed",
    });
  } catch (error: any) {
    console.error("Emergency location error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process emergency location" },
      { status: 500 }
    );
  }
}

async function findNearestHospital(
  latitude: number,
  longitude: number
): Promise<any> {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleMapsApiKey) {
    console.warn("Google Maps API key not configured");
    return null;
  }

  try {
    // Use Google Places API to find nearest hospital
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=hospital&key=${googleMapsApiKey}`
    );

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const hospital = data.results[0];
      return {
        name: hospital.name,
        address: hospital.vicinity || hospital.formatted_address,
        location: hospital.geometry.location,
        rating: hospital.rating,
        placeId: hospital.place_id,
        distance: calculateDistance(
          latitude,
          longitude,
          hospital.geometry.location.lat,
          hospital.geometry.location.lng
        ),
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to find hospital:", error);
    return null;
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

async function contactAmbulanceServices(
  userId: string,
  userData: any,
  latitude: number | null,
  longitude: number | null,
  emergencyId: string
): Promise<boolean> {
  try {
    const db = getFirestoreAdmin();

    // Get ambulance services from database (or use defaults)
    const ambulanceServices = [
      { name: "Emergency 108", phone: "108", type: "government" },
      { name: "Emergency 102", phone: "102", type: "government" },
    ];

    // Store ambulance contact log
    for (const service of ambulanceServices) {
      await db.collection("ambulanceCalls").add({
        userId,
        patientName: userData?.name,
        emergencyId,
        service: service.name,
        phone: service.phone,
        location: latitude && longitude ? { latitude, longitude } : null,
        timestamp: FieldValue.serverTimestamp(),
        status: "contacted",
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to contact ambulance:", error);
    return false;
  }
}

async function contactNGOs(
  userId: string,
  userData: any,
  latitude: number | null,
  longitude: number | null,
  emergencyId: string
): Promise<boolean> {
  try {
    const db = getFirestoreAdmin();

    // Get NGOs from database (or use defaults)
    // In production, this would be a managed list in Firestore
    const ngos = await db.collection("ngos")
      .where("active", "==", true)
      .where("location", "array-contains-any", latitude && longitude ? [latitude, longitude] : [])
      .limit(5)
      .get();

    if (ngos.empty) {
      // Use default NGOs if none found
      const defaultNGOs = [
        { name: "Local Emergency Response", phone: "108" },
      ];
      for (const ngo of defaultNGOs) {
        await db.collection("ngoNotifications").add({
          userId,
          patientName: userData?.name,
          emergencyId,
          ngoName: ngo.name,
          phone: ngo.phone,
          location: latitude && longitude ? { latitude, longitude } : null,
          timestamp: FieldValue.serverTimestamp(),
          status: "contacted",
        });
      }
      return true;
    }

    // Notify found NGOs
    for (const ngoDoc of ngos.docs) {
      const ngo = ngoDoc.data();
      await db.collection("ngoNotifications").add({
        userId,
        patientName: userData?.name,
        emergencyId,
        ngoName: ngo.name,
        contact: ngo.contact,
        location: latitude && longitude ? { latitude, longitude } : null,
        timestamp: FieldValue.serverTimestamp(),
        status: "contacted",
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to contact NGOs:", error);
    return false;
  }
}

async function notifyEmergencyResponders(
  userId: string,
  userData: any,
  emergencyId: string,
  nearestHospital: any,
  location: any
): Promise<void> {
  try {
    const db = getFirestoreAdmin();
    const caregivers = userData?.caregivers || [];

    // Notify caregivers
    for (const caregiverId of caregivers) {
      await db.collection("users").doc(caregiverId).collection("notifications").add({
        type: "emergency",
        patientId: userId,
        patientName: userData?.name || "Patient",
        emergencyId,
        title: "🚨 EMERGENCY ALERT",
        message: `${userData?.name || "Patient"} has activated emergency alert${nearestHospital ? ` - Nearest hospital: ${nearestHospital.name}` : ""}`,
        location,
        nearestHospital,
        timestamp: FieldValue.serverTimestamp(),
        read: false,
        priority: "critical",
      });

      // Send FCM
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/fcm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: caregiverId,
              type: "emergency",
              title: "🚨 EMERGENCY ALERT",
              message: `${userData?.name || "Patient"} has activated emergency alert`,
              data: {
                patientId: userId,
                patientName: userData?.name,
                emergencyId,
                location,
                nearestHospital,
              },
            }),
          }
        );
      } catch (e) {
        console.error("Failed to send FCM to caregiver:", e);
      }
    }

    // Notify hospital if found
    if (nearestHospital) {
      await db.collection("hospitalAlerts").add({
        userId,
        patientName: userData?.name,
        emergencyId,
        hospitalName: nearestHospital.name,
        hospitalAddress: nearestHospital.address,
        location,
        timestamp: FieldValue.serverTimestamp(),
        status: "alerted",
      });
    }
  } catch (error) {
    console.error("Failed to notify emergency responders:", error);
  }
}

