import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  alertsTable,
  facilitiesTable,
  notificationsTable,
  reportsTable,
  sheltersTable,
} from "@workspace/db";
import {
  CreateAlertBody,
  CreateReportBody,
  CreateShelterBody,
  DeleteAlertParams,
  DeleteShelterParams,
  GetShelterParams,
  GetShelterResponse,
  ListAlertsResponse,
  ListNotificationsResponse,
  ListReportsResponse,
  ListSheltersQueryParams,
  ListSheltersResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  ResolveAlertParams,
  ResolveAlertResponse,
  TriggerDemoEmergencyResponse,
  UpdateAlertBody,
  UpdateAlertParams,
  UpdateAlertResponse,
  UpdateReportBody,
  UpdateReportParams,
  UpdateReportResponse,
  UpdateShelterBody,
  UpdateShelterParams,
  UpdateShelterResponse,
  CreateShelterResponse,
  CreateAlertResponse,
  CreateReportResponse,
  GetActiveAlertsResponse,
  GetDashboardStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const seedShelters = [
  {
    name: "Government High School",
    address: "Station Road, Rajampet, Andhra Pradesh",
    latitude: 14.1908,
    longitude: 79.1577,
    capacity: 240,
    occupied: 195,
    status: "open",
    type: "school",
    phone: "",
    facilities: { food: true, water: true, medical: true, toilet: true, electricity: true, wheelchair: false, childcare: true, women_facility: true, pet_friendly: false },
  },
  {
    name: "Community Relief Center",
    address: "Old Bus Stand Road, Rajampet, Andhra Pradesh",
    latitude: 14.1843,
    longitude: 79.1639,
    capacity: 150,
    occupied: 78,
    status: "open",
    type: "relief_center",
    phone: "",
    facilities: { food: true, water: true, medical: true, toilet: true, electricity: true, wheelchair: true, childcare: true, women_facility: true, pet_friendly: false },
  },
  {
    name: "Zilla Parishad School",
    address: "Railway Colony, Rajampet, Andhra Pradesh",
    latitude: 14.2115,
    longitude: 79.1773,
    capacity: 180,
    occupied: 180,
    status: "full",
    type: "school",
    phone: "",
    facilities: { food: true, water: true, medical: false, toilet: true, electricity: true, wheelchair: false, childcare: true, women_facility: true, pet_friendly: false },
  },
  {
    name: "Municipal Community Hall",
    address: "Market Street, Rajampet, Andhra Pradesh",
    latitude: 14.204,
    longitude: 79.148,
    capacity: 120,
    occupied: 100,
    status: "limited",
    type: "community_hall",
    phone: "",
    facilities: { food: true, water: true, medical: false, toilet: true, electricity: true, wheelchair: true, childcare: false, women_facility: true, pet_friendly: false },
  },
  {
    name: "Rural Health Support Center",
    address: "Kadapa Road, Rajampet, Andhra Pradesh",
    latitude: 14.202,
    longitude: 79.139,
    capacity: 80,
    occupied: 64,
    status: "limited",
    type: "government",
    phone: "",
    facilities: { food: false, water: true, medical: true, toilet: true, electricity: true, wheelchair: true, childcare: false, women_facility: true, pet_friendly: false },
  },
  {
    name: "Tirupati Government Junior College",
    address: "Prakasam Road, Tirupati, Andhra Pradesh",
    latitude: 13.638,
    longitude: 79.411,
    capacity: 320,
    occupied: 125,
    status: "open",
    type: "school",
    phone: "",
    facilities: { food: true, water: true, medical: true, toilet: true, electricity: true, wheelchair: true, childcare: true, women_facility: true, pet_friendly: false },
  },
  {
    name: "Chittoor Municipal School",
    address: "Greamspet, Chittoor, Andhra Pradesh",
    latitude: 13.219,
    longitude: 79.096,
    capacity: 200,
    occupied: 70,
    status: "open",
    type: "school",
    phone: "",
    facilities: { food: true, water: true, medical: false, toilet: true, electricity: true, wheelchair: false, childcare: true, women_facility: true, pet_friendly: false },
  },
  {
    name: "Kadapa Sports Complex",
    address: "Co-operative Colony, Kadapa, Andhra Pradesh",
    latitude: 14.471,
    longitude: 78.822,
    capacity: 450,
    occupied: 210,
    status: "open",
    type: "government",
    phone: "",
    facilities: { food: true, water: true, medical: true, toilet: true, electricity: true, wheelchair: true, childcare: true, women_facility: true, pet_friendly: true },
  },
  {
    name: "Nellore District Relief Hall",
    address: "Magunta Layout, Nellore, Andhra Pradesh",
    latitude: 14.448,
    longitude: 79.985,
    capacity: 280,
    occupied: 150,
    status: "open",
    type: "relief_center",
    phone: "",
    facilities: { food: true, water: true, medical: true, toilet: true, electricity: true, wheelchair: true, childcare: true, women_facility: true, pet_friendly: false },
  },
  {
    name: "Tirupati Women and Family Center",
    address: "Tiruchanur Road, Tirupati, Andhra Pradesh",
    latitude: 13.625,
    longitude: 79.424,
    capacity: 90,
    occupied: 90,
    status: "closed",
    type: "ngo",
    phone: "",
    facilities: { food: true, water: true, medical: true, toilet: true, electricity: false, wheelchair: true, childcare: true, women_facility: true, pet_friendly: false },
  },
];

let seedPromise: Promise<void> | undefined;

type ShelterStatus = "open" | "limited" | "full" | "closed";

function deriveShelterStatus(capacity: number, occupied: number, requestedStatus: string): ShelterStatus {
  if (requestedStatus === "closed") return "closed";
  const available = Math.max(0, capacity - occupied);
  const availabilityRatio = available / Math.max(1, capacity);
  if (availabilityRatio < 0.15) return "full";
  if (availabilityRatio <= 0.4) return "limited";
  return "open";
}

async function seedDemoData(): Promise<void> {
  const existing = await db.select({ id: sheltersTable.id }).from(sheltersTable).limit(1);
  if (existing.length > 0) return;

  const insertedShelters = await db
    .insert(sheltersTable)
    .values(seedShelters.map(({ facilities: _facilities, ...shelter }) => shelter))
    .returning();

  await db.insert(facilitiesTable).values(
    insertedShelters.map((shelter, index) => ({
      shelterId: shelter.id,
      food: seedShelters[index].facilities.food,
      water: seedShelters[index].facilities.water,
      medical: seedShelters[index].facilities.medical,
      toilet: seedShelters[index].facilities.toilet,
      electricity: seedShelters[index].facilities.electricity,
      wheelchair: seedShelters[index].facilities.wheelchair,
      childcare: seedShelters[index].facilities.childcare,
      womenFacility: seedShelters[index].facilities.women_facility,
      petFriendly: seedShelters[index].facilities.pet_friendly,
    })),
  );

  const [alert] = await db
    .insert(alertsTable)
    .values({
      type: "cyclone",
      severity: "warning",
      title: "Cyclone watch — demonstration",
      message: "This simulated notice demonstrates how SafeReach displays a weather alert. It is not a real government alert.",
      location: "Rajampet, Andhra Pradesh",
      latitude: 14.1939,
      longitude: 79.1595,
      radiusKm: 10,
      recommendedAction: "Check official local updates. Follow emergency instructions from local authorities.",
      sirenEnabled: false,
      notificationEnabled: true,
      status: "active",
      isDemo: true,
    })
    .returning();

  await db.insert(notificationsTable).values({
    alertId: alert.id,
    title: alert.title,
    message: alert.message,
    type: "warning",
    isDemo: true,
  });
}

async function ensureDemoData(): Promise<void> {
  if (process.env.SEED_DEMO_DATA !== "true") {
    return;
  }
  seedPromise ??= seedDemoData().catch((error: unknown) => {
    seedPromise = undefined;
    throw error;
  });
  await seedPromise;
}

function toShelter(
  shelter: typeof sheltersTable.$inferSelect,
  facilities?: typeof facilitiesTable.$inferSelect,
) {
  return {
    id: shelter.id,
    name: shelter.name,
    address: shelter.address,
    latitude: shelter.latitude,
    longitude: shelter.longitude,
    capacity: shelter.capacity,
    occupied: shelter.occupied,
    status: deriveShelterStatus(shelter.capacity, shelter.occupied, shelter.status),
    type: shelter.type,
    phone: shelter.phone,
    facilities: {
      food: facilities?.food ?? false,
      water: facilities?.water ?? false,
      medical: facilities?.medical ?? false,
      toilet: facilities?.toilet ?? false,
      electricity: facilities?.electricity ?? false,
      wheelchair: facilities?.wheelchair ?? false,
      childcare: facilities?.childcare ?? false,
      women_facility: facilities?.womenFacility ?? false,
      pet_friendly: facilities?.petFriendly ?? false,
    },
    updatedAt: shelter.updatedAt.toISOString(),
  };
}

function toAlert(alert: typeof alertsTable.$inferSelect) {
  return { ...alert, radiusKm: alert.radiusKm, createdAt: alert.createdAt.toISOString(), updatedAt: alert.updatedAt.toISOString() };
}

function toNotification(notification: typeof notificationsTable.$inferSelect) {
  return { ...notification, createdAt: notification.createdAt.toISOString() };
}

async function getShelter(id: number) {
  const [row] = await db
    .select({ shelter: sheltersTable, facilities: facilitiesTable })
    .from(sheltersTable)
    .leftJoin(facilitiesTable, eq(facilitiesTable.shelterId, sheltersTable.id))
    .where(eq(sheltersTable.id, id))
    .limit(1);
  return row ? toShelter(row.shelter, row.facilities ?? undefined) : null;
}

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(bLat - aLat);
  const dLon = toRadians(bLon - aLon);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(aLat)) *
      Math.cos(toRadians(bLat)) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

router.get("/shelters", async (req, res): Promise<void> => {
  await ensureDemoData();
  const query = ListSheltersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Search filters are invalid." });
    return;
  }

  const filters = [];
  if (query.data.search?.trim()) {
    const pattern = `%${query.data.search.trim()}%`;
    filters.push(or(ilike(sheltersTable.name, pattern), ilike(sheltersTable.address, pattern)));
  }
  const rows = await db
    .select({ shelter: sheltersTable, facilities: facilitiesTable })
    .from(sheltersTable)
    .leftJoin(facilitiesTable, eq(facilitiesTable.shelterId, sheltersTable.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(sheltersTable.name);
  const shelters = rows
    .map((row) => toShelter(row.shelter, row.facilities ?? undefined))
    .filter((shelter) => !query.data.status || shelter.status === query.data.status);
  res.json(ListSheltersResponse.parse(shelters));
});

router.get("/shelters/:id", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = GetShelterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Shelter ID is invalid." });
    return;
  }
  const shelter = await getShelter(params.data.id);
  if (!shelter) {
    res.status(404).json({ error: "Shelter not found." });
    return;
  }
  res.json(GetShelterResponse.parse(shelter));
});

router.post("/shelters", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = CreateShelterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Shelter details are invalid." });
    return;
  }
  const { facilities, ...values } = parsed.data;
  const [shelter] = await db
    .insert(sheltersTable)
    .values({
      ...values,
      status: deriveShelterStatus(values.capacity, values.occupied, values.status),
    })
    .returning();
  await db.insert(facilitiesTable).values({
    shelterId: shelter.id,
    food: facilities.food,
    water: facilities.water,
    medical: facilities.medical,
    toilet: facilities.toilet,
    electricity: facilities.electricity,
    wheelchair: facilities.wheelchair,
    childcare: facilities.childcare,
    womenFacility: facilities.women_facility,
    petFriendly: facilities.pet_friendly,
  });
  const result = await getShelter(shelter.id);
  res.status(201).json(CreateShelterResponse.parse(result));
});

router.patch("/shelters/:id", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = UpdateShelterParams.safeParse(req.params);
  const parsed = UpdateShelterBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Shelter details are invalid." });
    return;
  }
  const { facilities, ...values } = parsed.data;
  const [current] = await db
    .select()
    .from(sheltersTable)
    .where(eq(sheltersTable.id, params.data.id))
    .limit(1);
  if (!current) {
    res.status(404).json({ error: "Shelter not found." });
    return;
  }
  const capacity = values.capacity ?? current.capacity;
  const occupied = values.occupied ?? current.occupied;
  const requestedStatus = values.status ?? current.status;
  const [updated] = await db
    .update(sheltersTable)
    .set({
      ...values,
      status: deriveShelterStatus(capacity, occupied, requestedStatus),
      updatedAt: new Date(),
    })
    .where(eq(sheltersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Shelter not found." });
    return;
  }
  if (facilities) {
    await db
      .insert(facilitiesTable)
      .values({
        shelterId: updated.id,
        food: facilities.food,
        water: facilities.water,
        medical: facilities.medical,
        toilet: facilities.toilet,
        electricity: facilities.electricity,
        wheelchair: facilities.wheelchair,
        childcare: facilities.childcare,
        womenFacility: facilities.women_facility,
        petFriendly: facilities.pet_friendly,
      })
      .onConflictDoUpdate({
        target: facilitiesTable.shelterId,
        set: {
          food: facilities.food,
          water: facilities.water,
          medical: facilities.medical,
          toilet: facilities.toilet,
          electricity: facilities.electricity,
          wheelchair: facilities.wheelchair,
          childcare: facilities.childcare,
          womenFacility: facilities.women_facility,
          petFriendly: facilities.pet_friendly,
        },
      });
  }
  const result = await getShelter(updated.id);
  res.json(UpdateShelterResponse.parse(result));
});

router.delete("/shelters/:id", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = DeleteShelterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Shelter ID is invalid." });
    return;
  }
  const deleted = await db.delete(sheltersTable).where(eq(sheltersTable.id, params.data.id)).returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "Shelter not found." });
    return;
  }
  res.status(204).send();
});

router.get("/alerts", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const rows = await db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt));
  res.json(ListAlertsResponse.parse(rows.map(toAlert)));
});

router.get("/alerts/active", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const rows = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.status, "active"))
    .orderBy(desc(alertsTable.createdAt));
  res.json(GetActiveAlertsResponse.parse(rows.map(toAlert)));
});

router.post("/alerts", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = CreateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Alert details are invalid." });
    return;
  }
  const [alert] = await db
    .insert(alertsTable)
    .values({ ...parsed.data, isDemo: true })
    .returning();
  if (alert.notificationEnabled && alert.status === "active") {
    await db.insert(notificationsTable).values({
      alertId: alert.id,
      title: alert.title,
      message: alert.message,
      type: alert.severity,
      isDemo: true,
    });
  }
  res.status(201).json(CreateAlertResponse.parse(toAlert(alert)));
});

router.patch("/alerts/:id", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = UpdateAlertParams.safeParse(req.params);
  const parsed = UpdateAlertBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Alert details are invalid." });
    return;
  }
  const [alert] = await db
    .update(alertsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(alertsTable.id, params.data.id))
    .returning();
  if (!alert) {
    res.status(404).json({ error: "Alert not found." });
    return;
  }
  res.json(UpdateAlertResponse.parse(toAlert(alert)));
});

router.delete("/alerts/:id", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = DeleteAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Alert ID is invalid." });
    return;
  }
  const deleted = await db.delete(alertsTable).where(eq(alertsTable.id, params.data.id)).returning();
  if (deleted.length === 0) {
    res.status(404).json({ error: "Alert not found." });
    return;
  }
  res.status(204).send();
});

router.post("/alerts/:id/resolve", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = ResolveAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Alert ID is invalid." });
    return;
  }
  const [alert] = await db
    .update(alertsTable)
    .set({ status: "resolved", updatedAt: new Date() })
    .where(eq(alertsTable.id, params.data.id))
    .returning();
  if (!alert) {
    res.status(404).json({ error: "Alert not found." });
    return;
  }
  await db.insert(notificationsTable).values({
    alertId: alert.id,
    title: "Emergency update",
    message: `The demonstration alert “${alert.title}” has been marked resolved. Continue following local authority instructions.`,
    type: "information",
    isDemo: true,
  });
  res.json(ResolveAlertResponse.parse(toAlert(alert)));
});

router.get("/notifications", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const rows = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt));
  res.json(ListNotificationsResponse.parse(rows.map(toNotification)));
});

router.put("/notifications/:id/read", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Notification ID is invalid." });
    return;
  }
  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found." });
    return;
  }
  res.json(MarkNotificationReadResponse.parse(toNotification(notification)));
});

router.put("/notifications/read-all", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const rows = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.isRead, false))
    .returning();
  res.json(MarkAllNotificationsReadResponse.parse(rows.map(toNotification)));
});

router.get("/reports", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const rows = await db
    .select({ report: reportsTable, shelterName: sheltersTable.name })
    .from(reportsTable)
    .innerJoin(sheltersTable, eq(sheltersTable.id, reportsTable.shelterId))
    .orderBy(desc(reportsTable.createdAt));
  res.json(
    ListReportsResponse.parse(
      rows.map(({ report, shelterName }) => ({
        ...report,
        shelterName,
        createdAt: report.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/reports", async (req, res): Promise<void> => {
  await ensureDemoData();
  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Report details are invalid." });
    return;
  }
  const [shelter] = await db
    .select({ name: sheltersTable.name })
    .from(sheltersTable)
    .where(eq(sheltersTable.id, parsed.data.shelterId))
    .limit(1);
  if (!shelter) {
    res.status(404).json({ error: "Shelter not found." });
    return;
  }
  const [report] = await db.insert(reportsTable).values(parsed.data).returning();
  res.status(201).json(
    CreateReportResponse.parse({
      ...report,
      shelterName: shelter.name,
      createdAt: report.createdAt.toISOString(),
    }),
  );
});

router.patch("/reports/:id", async (req, res): Promise<void> => {
  await ensureDemoData();
  const params = UpdateReportParams.safeParse(req.params);
  const parsed = UpdateReportBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Report update is invalid." });
    return;
  }
  const [report] = await db
    .update(reportsTable)
    .set(parsed.data)
    .where(eq(reportsTable.id, params.data.id))
    .returning();
  if (!report) {
    res.status(404).json({ error: "Report not found." });
    return;
  }
  const [shelter] = await db
    .select({ name: sheltersTable.name })
    .from(sheltersTable)
    .where(eq(sheltersTable.id, report.shelterId))
    .limit(1);
  res.json(
    UpdateReportResponse.parse({
      ...report,
      shelterName: shelter?.name ?? "Unknown shelter",
      createdAt: report.createdAt.toISOString(),
    }),
  );
});

router.get("/stats", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const shelters = await db.select().from(sheltersTable);
  const statuses = shelters.map((item) => deriveShelterStatus(item.capacity, item.occupied, item.status));
  const alerts = await db.select({ id: alertsTable.id }).from(alertsTable).where(eq(alertsTable.status, "active"));
  const reports = await db.select({ id: reportsTable.id }).from(reportsTable).where(eq(reportsTable.status, "pending"));
  const stats = {
    totalShelters: shelters.length,
    open: statuses.filter((status) => status === "open").length,
    limited: statuses.filter((status) => status === "limited").length,
    full: statuses.filter((status) => status === "full").length,
    closed: statuses.filter((status) => status === "closed").length,
    totalCapacity: shelters.reduce((total, item) => total + item.capacity, 0),
    availableCapacity: shelters.reduce(
      (total, item) => total + Math.max(0, item.capacity - item.occupied),
      0,
    ),
    activeAlerts: alerts.length,
    pendingReports: reports.length,
  };
  res.json(GetDashboardStatsResponse.parse(stats));
});

router.post("/demo/emergency", async (_req, res): Promise<void> => {
  await ensureDemoData();
  const [alert] = await db
    .insert(alertsTable)
    .values({
      type: "flood",
      severity: "critical",
      title: "Critical flood alert — demo only",
      message: "Severe flooding is shown in this simulated scenario. This is not a real emergency notice.",
      location: "Rajampet, Andhra Pradesh",
      latitude: 14.1939,
      longitude: 79.1595,
      radiusKm: 10,
      recommendedAction: "This is a demo. For real emergencies, follow official instructions and call 112 in India.",
      sirenEnabled: true,
      notificationEnabled: true,
      status: "active",
      isDemo: true,
    })
    .returning();
  const [notification] = await db
    .insert(notificationsTable)
    .values({
      alertId: alert.id,
      title: alert.title,
      message: alert.message,
      type: "critical",
      isDemo: true,
    })
    .returning();

  const shelterRows = await db
    .select({ shelter: sheltersTable, facilities: facilitiesTable })
    .from(sheltersTable)
    .leftJoin(facilitiesTable, eq(facilitiesTable.shelterId, sheltersTable.id));
  const recommendation = shelterRows
    .filter(({ shelter }) => shelter.status !== "full" && shelter.status !== "closed")
    .map(({ shelter, facilities }) => {
      const available = Math.max(0, shelter.capacity - shelter.occupied);
      const facilityScore =
        Number(facilities?.medical) +
        Number(facilities?.food) +
        Number(facilities?.water) +
        Number(facilities?.wheelchair);
      const distance = distanceKm(alert.latitude, alert.longitude, shelter.latitude, shelter.longitude);
      const score =
        (shelter.status === "open" ? 40 : 20) +
        Math.min(25, available / 4) +
        facilityScore * 5 -
        distance * 2;
      return { shelter, facilities: facilities ?? undefined, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (!recommendation) {
    res.status(503).json({ error: "No available shelter is listed in the demo data." });
    return;
  }
  res.status(201).json(
    TriggerDemoEmergencyResponse.parse({
      alert: toAlert(alert),
      notification: toNotification(notification),
      recommendation: toShelter(recommendation.shelter, recommendation.facilities),
    }),
  );
});

export default router;
