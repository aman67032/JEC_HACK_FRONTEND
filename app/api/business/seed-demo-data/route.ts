import { NextRequest, NextResponse } from "next/server";
import { getFirestoreAdmin } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { businessId } = await req.json();
    
    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required" },
        { status: 400 }
      );
    }

    const db = getFirestoreAdmin();
    const businessRef = db.collection("users").doc(businessId);

    // Check if business exists
    const businessDoc = await businessRef.get();
    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Seed Orders
    const ordersRef = businessRef.collection("orders");
    const demoOrders = [
      {
        orderNumber: "ORD-001234",
        customerName: "Rajesh Kumar",
        customerEmail: "rajesh@example.com",
        customerPhone: "+91 9876543210",
        items: [
          { name: "Paracetamol 500mg", quantity: 2, price: 25 },
          { name: "Azithromycin 500mg", quantity: 1, price: 120 },
        ],
        totalItems: 3,
        amount: 1250,
        status: "in-transit",
        deliveryAddress: "123 Main St, Sector 5, City",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins
      },
      {
        orderNumber: "ORD-001235",
        customerName: "Priya Sharma",
        customerEmail: "priya@example.com",
        customerPhone: "+91 9876543211",
        items: [
          { name: "Amoxicillin 250mg", quantity: 2, price: 45 },
        ],
        totalItems: 2,
        amount: 890,
        status: "dispatched",
        deliveryAddress: "456 Park Ave, Sector 10, City",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      },
      {
        orderNumber: "ORD-001236",
        customerName: "Amit Patel",
        customerEmail: "amit@example.com",
        customerPhone: "+91 9876543212",
        items: [
          { name: "Paracetamol 500mg", quantity: 3, price: 25 },
          { name: "Ibuprofen 400mg", quantity: 2, price: 35 },
        ],
        totalItems: 5,
        amount: 2100,
        status: "pending",
        deliveryAddress: "789 Oak St, Sector 15, City",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        estimatedDelivery: null,
      },
      {
        orderNumber: "ORD-001237",
        customerName: "Sunita Devi",
        customerEmail: "sunita@example.com",
        customerPhone: "+91 9876543213",
        items: [
          { name: "Azithromycin 500mg", quantity: 1, price: 120 },
        ],
        totalItems: 1,
        amount: 450,
        status: "delivered",
        deliveryAddress: "321 Pine Rd, Sector 20, City",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        deliveredAt: new Date(Date.now() - 86400000).toISOString(),
        estimatedDelivery: null,
      },
      {
        orderNumber: "ORD-001238",
        customerName: "Ravi Singh",
        customerEmail: "ravi@example.com",
        customerPhone: "+91 9876543214",
        items: [
          { name: "Amoxicillin 250mg", quantity: 4, price: 45 },
        ],
        totalItems: 4,
        amount: 1800,
        status: "processing",
        deliveryAddress: "654 Elm St, Sector 25, City",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        estimatedDelivery: null,
      },
      {
        orderNumber: "ORD-001239",
        customerName: "Meera Joshi",
        customerEmail: "meera@example.com",
        customerPhone: "+91 9876543215",
        items: [
          { name: "Paracetamol 500mg", quantity: 1, price: 25 },
        ],
        totalItems: 1,
        amount: 320,
        status: "delivered",
        deliveryAddress: "987 Maple Ave, Sector 30, City",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        deliveredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        estimatedDelivery: null,
      },
    ];

    for (const order of demoOrders) {
      await ordersRef.doc(order.orderNumber).set(order);
    }

    // Seed Inventory
    const inventoryRef = businessRef.collection("inventory");
    const demoInventory = [
      {
        medicineName: "Paracetamol 500mg",
        brand: "Generic",
        quantity: 150,
        unit: "tablets",
        price: 25,
        expiryDate: "2025-12-31",
        lowStockThreshold: 50,
        licenseNumber: "DL-MED-12345",
        category: "Pain Relief",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        medicineName: "Azithromycin 500mg",
        brand: "Azithro",
        quantity: 30,
        unit: "tablets",
        price: 120,
        expiryDate: "2025-06-30",
        lowStockThreshold: 50,
        licenseNumber: "DL-MED-12345",
        category: "Antibiotic",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        medicineName: "Amoxicillin 250mg",
        brand: "Amoxi",
        quantity: 200,
        unit: "capsules",
        price: 45,
        expiryDate: "2026-03-15",
        lowStockThreshold: 100,
        licenseNumber: "DL-MED-12345",
        category: "Antibiotic",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        medicineName: "Ibuprofen 400mg",
        brand: "Ibu",
        quantity: 25,
        unit: "tablets",
        price: 35,
        expiryDate: "2025-09-20",
        lowStockThreshold: 50,
        licenseNumber: "DL-MED-12345",
        category: "Pain Relief",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        medicineName: "Metformin 500mg",
        brand: "Metro",
        quantity: 180,
        unit: "tablets",
        price: 55,
        expiryDate: "2026-01-10",
        lowStockThreshold: 75,
        licenseNumber: "DL-MED-12345",
        category: "Diabetes",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      {
        medicineName: "Cetirizine 10mg",
        brand: "Cetri",
        quantity: 100,
        unit: "tablets",
        price: 30,
        expiryDate: "2025-11-30",
        lowStockThreshold: 50,
        licenseNumber: "DL-MED-12345",
        category: "Allergy",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    ];

    for (const item of demoInventory) {
      await inventoryRef.doc(item.medicineName.replace(/\s+/g, "_")).set(item);
    }

    // Update business stats
    await businessRef.set({
      stats: {
        totalOrders: demoOrders.length,
        activeDeliveries: demoOrders.filter((o) => o.status === "in-transit" || o.status === "dispatched").length,
        completedDeliveries: demoOrders.filter((o) => o.status === "delivered").length,
        pendingOrders: demoOrders.filter((o) => o.status === "pending" || o.status === "processing").length,
        totalRevenue: demoOrders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + o.amount, 0),
        monthlyRevenue: 45678,
      },
      inventoryCount: demoInventory.length,
      lastUpdated: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      orders: demoOrders.length,
      inventory: demoInventory.length,
    });
  } catch (error: any) {
    console.error("Error seeding demo data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed demo data" },
      { status: 500 }
    );
  }
}

