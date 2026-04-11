import { createServerFn } from "@tanstack/react-start";
import { getCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  ApiError,
  type CreateVenueRequest,
  type Facility,
  type UpdateVenueRequest,
  type Venue,
  type VenueListFilters,
  eventsApi,
  venuesApi,
  organizersApi,
  usersApi,
  categoriesApi,
  tagsApi,
  paymentMethodsApi,
  ordersApi,
} from "@/lib/api-client";
import { normalizeOrderDetails, normalizeOrdersListResponse } from "@/lib/orders-admin";

const COOKIE_TOKEN = "tazkara-admin-token";
const COOKIE_EMAIL = "tazkara-admin-email";
const COOKIE_EXPIRES = "tazkara-admin-exp";

// Helper to get admin token from cookies
function getAdminToken(): string | null {
  const token = getCookie(COOKIE_TOKEN);
  const expiresAt = Number(getCookie(COOKIE_EXPIRES) || "0");

  if (!token) {
    return null;
  }
  if (Date.now() > expiresAt) {
    deleteCookie(COOKIE_TOKEN);
    deleteCookie(COOKIE_EMAIL);
    deleteCookie(COOKIE_EXPIRES);
    return null;
  }
  return token;
}

function requireAdminToken(): string {
  const token = getAdminToken();
  if (!token) {
    throw new Error("Unauthorized: missing or expired admin session cookie. Please log in again.");
  }
  return token;
}

function unwrapData<T>(payload: unknown): T {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

// ─── Events ──────────────────────────────────────────────

export const listEventsAdmin = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).optional(),
      limit: z.number().min(1).max(100).optional(),
      search: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await eventsApi.listAdmin(data.page ?? 1, data.limit ?? 20, token);
    return result;
  });

export const createEventAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.record(z.string(), z.unknown()))
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await eventsApi.createAdmin(data as any, token);
    return result;
  });

export const updateEventAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      updates: z.record(z.string(), z.unknown()),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await eventsApi.updateAdmin(data.id, data.updates as any, token);
    return result;
  });

export const deleteEventAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    await eventsApi.deleteAdmin(data.id, token);
    return { success: true };
  });

// ─── Venues ──────────────────────────────────────────────

export const listVenuesAdmin = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).optional(),
      limit: z.number().min(1).max(20).optional(),
      governorateId: z.string().optional(),
      type: z.enum(["STADIUM", "THEATER", "HALL", "ARENA", "OUTDOOR", "OTHER"]).optional(),
    })
  )
  .handler(async ({ data }) => {
    const filters: VenueListFilters = {
      governorateId: data.governorateId,
      type: data.type,
    };
    const result = await venuesApi.listPublicVenues(data.page ?? 1, data.limit ?? 20, filters);
    const payload = unwrapData<{ data: Venue[]; total: number; page: number; limit: number }>(result);
    return {
      rows: Array.isArray(payload.data) ? payload.data : [],
      total: payload.total ?? 0,
      page: payload.page ?? data.page ?? 1,
      limit: payload.limit ?? data.limit ?? 20,
    } as any;
  });

export const listVenueFacilitiesAdmin = createServerFn({ method: "GET" })
  .handler(async () => {
    const result = await venuesApi.listFacilities();
    return unwrapData<Facility[]>(result);
  });

export const getVenueAdmin = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const result = await venuesApi.getPublicVenue(data.id);
    return unwrapData<Venue>(result) as any;
  });

export const canWriteVenuesAdmin = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = await getAdminToken();
    return Boolean(token);
  });

export const createVenueAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.record(z.string(), z.unknown()))
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await venuesApi.createVenue(data as unknown as CreateVenueRequest, token);
    return unwrapData<Venue>(result) as any;
  });

export const updateVenueAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      updates: z.record(z.string(), z.unknown()),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await venuesApi.updateMyVenue(data.id, data.updates as UpdateVenueRequest, token);
    return unwrapData<Venue>(result) as any;
  });

export const deleteVenueAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    await venuesApi.archiveAdmin(data.id, token);
    return { success: true };
  });

export const approveVenueAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await venuesApi.approveAdmin(data.id, token);
    return unwrapData<Venue>(result) as any;
  });

export const rejectVenueAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      reason: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    await venuesApi.rejectAdmin(data.id, data.reason, token);
    return { success: true };
  });

export const archiveVenueAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    await venuesApi.archiveAdmin(data.id, token);
    return { success: true };
  });

// ─── Organizers ──────────────────────────────────────────

export const listOrganizersAdmin = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).optional(),
      limit: z.number().min(1).max(100).optional(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await organizersApi.listAdmin(data.page ?? 1, data.limit ?? 20, token);
    return result;
  });

export const updateOrganizerAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      updates: z.record(z.string(), z.unknown()),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await organizersApi.updateAdmin(data.id, data.updates as any, token);
    return result;
  });

export const deleteOrganizerAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    await organizersApi.deleteAdmin(data.id, token);
    return { success: true };
  });

// ─── Users ───────────────────────────────────────────────

export const listUsersAdmin = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).optional(),
      limit: z.number().min(1).max(100).optional(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await usersApi.listAdmin(data.page ?? 1, data.limit ?? 20, token);
    return result;
  });

export const updateUserAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      updates: z.record(z.string(), z.unknown()),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await usersApi.updateAdmin(data.id, data.updates as any, token);
    return result;
  });

export const deleteUserAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    await usersApi.deleteAdmin(data.id, token);
    return { success: true };
  });

// ─── Categories ──────────────────────────────────────────

export const listCategoriesAdmin = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = requireAdminToken();
    const result = await categoriesApi.listAdmin(token);
    return result;
  });

export const createCategoryAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.record(z.string(), z.unknown()))
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await categoriesApi.createAdmin(data as any, token);
    return result;
  });

export const updateCategoryAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      updates: z.record(z.string(), z.unknown()),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await categoriesApi.updateAdmin(data.id, data.updates as any, token);
    return result;
  });

export const deleteCategoryAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    await categoriesApi.deleteAdmin(data.id, token);
    return { success: true };
  });

// ─── Tags ────────────────────────────────────────────────

export const listTagsAdmin = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = requireAdminToken();
    const result = await tagsApi.listAdmin(token);
    return result;
  });

export const createTagAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.record(z.string(), z.unknown()))
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await tagsApi.createAdmin(data as any, token);
    return result;
  });

export const updateTagAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      updates: z.record(z.string(), z.unknown()),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await tagsApi.updateAdmin(data.id, data.updates as any, token);
    return result;
  });

export const deleteTagAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    await tagsApi.deleteAdmin(data.id, token);
    return { success: true };
  });

// ─── Payment Methods ──────────────────────────────────────

export const listPaymentMethodsAdmin = createServerFn({ method: "GET" })
  .handler(async () => {
    const token = requireAdminToken();
    const result = await paymentMethodsApi.listAdmin(token);
    return result;
  });

export const createPaymentMethodAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.record(z.string(), z.unknown()))
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await paymentMethodsApi.createAdmin(data as any, token);
    return result;
  });

export const updatePaymentMethodAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      updates: z.record(z.string(), z.unknown()),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await paymentMethodsApi.updateAdmin(data.id, data.updates as any, token);
    return result;
  });

export const deletePaymentMethodAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    await paymentMethodsApi.deleteAdmin(data.id, token);
    return { success: true };
  });

// ─── Orders ──────────────────────────────────────────────

export const listOrdersAdmin = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      page: z.number().min(1).optional(),
      limit: z.number().min(1).max(100).optional(),
      search: z.string().optional(),
      orderNumber: z.string().optional(),
      userPhone: z.string().optional(),
      eventId: z.string().optional(),
      statuses: z.array(z.string()).optional(),
      paymentMethod: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  )
  .handler(async ({ data }): Promise<any> => {
    const token = requireAdminToken();

    const page = data.page ?? 1;
    const limit = data.limit ?? 20;
    const status = data.statuses?.length ? data.statuses[0] : undefined;

    const filters = {
      search: data.search,
      orderNumber: data.orderNumber,
      userPhone: data.userPhone,
      eventId: data.eventId,
      status,
      paymentMethod: data.paymentMethod,
      startDate: data.startDate,
      endDate: data.endDate,
    };

    try {
      const result = await ordersApi.listAdmin(page, limit, token, filters);
      return {
        ...normalizeOrdersListResponse(result, { page, limit }),
        backendGap: false,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return {
          rows: [],
          total: 0,
          page,
          limit,
          backendGap: true,
        };
      }
      throw error;
    }
  });

export const getOrderAdmin = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }): Promise<any> => {
    const token = requireAdminToken();

    try {
      const result = await ordersApi.getAdmin(data.id, token);
      return normalizeOrderDetails(result);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error(
          "Order details are unavailable because GET /api/v1/admin/orders/{id} is not live on backend yet."
        );
      }
      throw error;
    }
  });

export const cancelOrderAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const token = requireAdminToken();
    const result = await ordersApi.cancelAdmin(data.id, token);
    return result;
  });

export const refundOrderAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
    })
  )
  .handler(async ({ data }): Promise<any> => {
    const token = requireAdminToken();
    const result = await ordersApi.refundAdmin(data.id, token);
    return unwrapData<Record<string, unknown>>(result);
  });


