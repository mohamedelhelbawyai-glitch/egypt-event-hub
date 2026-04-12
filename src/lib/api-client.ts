import { getCookie } from "@tanstack/react-start/server";

// ─── Configuration ───────────────────────────────────────
const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.API_BASE_URL || "https://tazkara-backend-production.up.railway.app/api/v1"
    : "https://tazkara-backend-production.up.railway.app/api/v1";

// ─── Error Handling ──────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Request Wrapper ────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, token } = options;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      let errorData: unknown;
      try {
        errorData = await res.json();
      } catch {
        errorData = await res.text();
      }
      const message =
        typeof errorData === "object" && errorData && "message" in errorData
          ? String((errorData as { message: string }).message)
          : `Request failed with status ${res.status}`;
      throw new ApiError(res.status, `${message} [${method} ${path}]`, errorData);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, error instanceof Error ? error.message : "Network error");
  }
}

// ─── Generic Helpers ────────────────────────────────────

export function apiGet<T>(path: string, token?: string) {
  return request<T>(path, { token });
}

export function apiPost<T>(path: string, body: unknown, token?: string) {
  return request<T>(path, { method: "POST", body, token });
}

export function apiPatch<T>(path: string, body: unknown, token?: string) {
  return request<T>(path, { method: "PATCH", body, token });
}

export function apiDelete<T>(path: string, token?: string) {
  return request<T>(path, { method: "DELETE", token });
}

// ─── Auth API ────────────────────────────────────────────

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RegisterRequest {
  phone: string;
}

export interface RegisterResponse {
  otpExpiresAt: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  adminLogin: (data: AdminLoginRequest) =>
    request<AdminAuthResponse>("/auth/admin/login", { method: "POST", body: data }),

  register: (data: RegisterRequest) =>
    request<RegisterResponse>("/auth/register", { method: "POST", body: data }),

  verifyOtp: (data: VerifyOtpRequest) =>
    request<AuthResponse>("/auth/verify-otp", { method: "POST", body: data }),

  me: (token: string) =>
    request<any>("/auth/me", { token }),

  logout: (token: string) =>
    request<{ success: boolean }>("/auth/logout", { method: "POST", token }),

  refresh: (refreshToken: string) =>
    request<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    }),
};

// ─── Users API ──────────────────────────────────────────

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  loyaltyPoints: number;
  createdAt: string;
}

export interface UpdateProfileRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export const usersApi = {
  getMe: (token: string) =>
    request<UserProfile>("/users/me", { token }),

  updateMe: (data: UpdateProfileRequest, token: string) =>
    request<UserProfile>("/users/me", { method: "PATCH", body: data, token }),

  resendOtp: (token: string) =>
    request<{ otpExpiresAt: string }>("/users/me/resend-otp", {
      method: "POST",
      token,
    }),

  // Admin
  listAdmin: (page = 1, limit = 20, token: string) =>
    request<any>(`/admin/users?page=${page}&limit=${limit}`, { token }),

  getAdmin: (id: string, token: string) =>
    request<UserProfile>(`/admin/users/${id}`, { token }),

  updateAdmin: (id: string, data: UpdateProfileRequest, token: string) =>
    request<UserProfile>(`/admin/users/${id}`, { method: "PATCH", body: data, token }),

  deleteAdmin: (id: string, token: string) =>
    request<any>(`/admin/users/${id}`, { method: "DELETE", token }),

  suspendAdmin: (id: string, reason: string, token: string) =>
    request<any>(`/admin/users/${id}/suspend`, {
      method: "POST",
      body: { reason },
      token,
    }),

  banAdmin: (id: string, reason: string, token: string) =>
    request<any>(`/admin/users/${id}/ban`, {
      method: "POST",
      body: { reason },
      token,
    }),

  reactivateAdmin: (id: string, token: string) =>
    request<any>(`/admin/users/${id}/reactivate`, { method: "POST", token }),
};

// ─── Organizers API ─────────────────────────────────────

export interface OrganizerProfile {
  id: string;
  userId: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  phone?: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  trustTier: number;
  verifiedBadge: boolean;
  followersCount: number;
  eventsCount: number;
  createdAt: string;
}

export interface CreateOrganizerRequest {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  phone?: string;
}

export interface UpdateOrganizerRequest {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  phone?: string;
}

export const organizersApi = {
  createOrganizerProfile: (data: CreateOrganizerRequest, token: string) =>
    request<OrganizerProfile>("/organizers", { method: "POST", body: data, token }),

  getMyProfile: (token: string) =>
    request<OrganizerProfile>("/organizers/me", { token }),

  updateMyProfile: (data: UpdateOrganizerRequest, token: string) =>
    request<OrganizerProfile>("/organizers/me", { method: "PATCH", body: data, token }),

  getPublicProfile: (id: string) =>
    request<OrganizerProfile>(`/organizers/${id}`),

  // Admin
  listAdmin: (page = 1, limit = 20, token: string) =>
    request<any>(`/admin/organizers?page=${page}&limit=${limit}`, { token }),

  listPendingAdmin: (token: string, page = 1, limit = 20) =>
    request<any>(`/admin/organizers/pending?page=${page}&limit=${limit}`, { token }),

  getAdmin: (id: string, token: string) =>
    request<OrganizerProfile>(`/admin/organizers/${id}`, { token }),

  createAdmin: (data: CreateOrganizerRequest, token: string) =>
    request<OrganizerProfile>("/admin/organizers", { method: "POST", body: data, token }),

  updateAdmin: (id: string, data: UpdateOrganizerRequest, token: string) =>
    request<OrganizerProfile>(`/admin/organizers/${id}`, { method: "PATCH", body: data, token }),

  deleteAdmin: (id: string, token: string) =>
    request<any>(`/admin/organizers/${id}`, { method: "DELETE", token }),

  approveAdmin: (id: string, token: string) =>
    request<OrganizerProfile>(`/admin/organizers/${id}/approve`, {
      method: "POST",
      token,
    }),

  rejectAdmin: (id: string, reason: string, token: string) =>
    request<any>(`/admin/organizers/${id}/reject`, {
      method: "POST",
      body: { reason },
      token,
    }),

  suspendAdmin: (id: string, reason: string, token: string) =>
    request<any>(`/admin/organizers/${id}/suspend`, {
      method: "POST",
      body: { reason },
      token,
    }),

  reactivateAdmin: (id: string, token: string) =>
    request<any>(`/admin/organizers/${id}/reactivate`, { method: "POST", token }),
};

// ─── Venues API ─────────────────────────────────────────

export interface Venue {
  id: string;
  nameAr: string;
  nameEn: string;
  type: "STADIUM" | "THEATER" | "HALL" | "ARENA" | "OUTDOOR" | "OTHER";
  governorateId: string;
  cityId?: string | null;
  addressAr: string;
  addressEn: string;
  lat: number;
  lng: number;
  totalCapacity: number;
  seatsioChartKey?: string | null;
  sections?: Record<string, unknown> | null;
  photos: string[];
  googleMapsUrl?: string | null;
  submittedByOrgId?: string | null;
  approvedByAdminId?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
  facilities: Facility[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVenueRequest {
  nameAr: string;
  nameEn: string;
  type: "STADIUM" | "THEATER" | "HALL" | "ARENA" | "OUTDOOR" | "OTHER";
  governorateId: string;
  cityId?: string;
  addressAr: string;
  addressEn: string;
  lat: number;
  lng: number;
  totalCapacity: number;
  photos?: string[];
  googleMapsUrl?: string;
  sections?: Record<string, unknown>;
  facilityIds?: string[];
}

export interface UpdateVenueRequest {
  nameAr?: string;
  nameEn?: string;
  type?: "STADIUM" | "THEATER" | "HALL" | "ARENA" | "OUTDOOR" | "OTHER";
  governorateId?: string;
  cityId?: string;
  addressAr?: string;
  addressEn?: string;
  lat?: number;
  lng?: number;
  totalCapacity?: number;
  photos?: string[];
  googleMapsUrl?: string;
  sections?: Record<string, unknown>;
  facilityIds?: string[];
}

export interface Facility {
  id: string;
  nameAr: string;
  nameEn: string;
  iconUrl?: string | null;
}

export interface VenueListFilters {
  governorateId?: string;
  type?: "STADIUM" | "THEATER" | "HALL" | "ARENA" | "OUTDOOR" | "OTHER";
}

function buildVenueListQuery(page: number, limit: number, filters?: VenueListFilters) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.governorateId) {
    params.set("governorateId", filters.governorateId);
  }
  if (filters?.type) {
    params.set("type", filters.type);
  }
  return params.toString();
}

export const venuesApi = {
  listFacilities: () =>
    request<any>("/venues/facilities"),

  listMyVenues: (token: string, page = 1, limit = 20, filters?: VenueListFilters) =>
    request<any>(`/venues/my?${buildVenueListQuery(page, limit, filters)}`, { token }),

  createVenue: (data: CreateVenueRequest, token: string) =>
    request<any>("/venues", { method: "POST", body: data, token }),

  listPublicVenues: (page = 1, limit = 20, filters?: VenueListFilters) =>
    request<any>(`/venues?${buildVenueListQuery(page, limit, filters)}`),

  getMyVenue: (id: string, token: string) =>
    request<any>(`/venues/my/${id}`, { token }),

  updateMyVenue: (id: string, data: UpdateVenueRequest, token: string) =>
    request<any>(`/venues/my/${id}`, { method: "PATCH", body: data, token }),

  archiveMyVenue: (id: string, token: string) =>
    request<any>(`/venues/my/${id}`, { method: "DELETE", token }),

  getPublicVenue: (id: string) =>
    request<any>(`/venues/${id}`),

  // Admin moderation
  approveAdmin: (id: string, token: string) =>
    request<any>(`/admin/venues/${id}/approve`, { method: "POST", token }),

  rejectAdmin: (id: string, reason: string, token: string) =>
    request<any>(`/admin/venues/${id}/reject`, {
      method: "POST",
      body: { reason },
      token,
    }),

  archiveAdmin: (id: string, token: string) =>
    request<any>(`/admin/venues/${id}/archive`, { method: "POST", token }),
};

// ─── Events API ──────────────────────────────────────────

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  color?: string;
  sortOrder: number;
}

export interface Tag {
  id: string;
  nameEn: string;
  nameAr: string;
  isFeatured: boolean;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold: number;
  createdAt: string;
}

export interface Event {
  id: string;
  organizerId: string;
  venueId?: string;
  name: string;
  description?: string;
  categoryId: string;
  format: "ONLINE" | "HYBRID" | "PHYSICAL";
  startsAt: string;
  endsAt: string;
  governorateId?: string;
  image?: string;
  status:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "PUBLISHED"
    | "ON_SALE"
    | "SOLD_OUT"
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED";
  tagIds?: string[];
  ticketTypes?: TicketType[];
  createdAt: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  categoryId: string;
  format: "ONLINE" | "HYBRID" | "PHYSICAL";
  startsAt: string;
  endsAt: string;
  venueId?: string;
  governorateId?: string;
  image?: string;
  tagIds?: string[];
  ticketTypes?: Array<{
    name: string;
    description?: string;
    price: number;
    quantity: number;
  }>;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  categoryId?: string;
  format?: "ONLINE" | "HYBRID" | "PHYSICAL";
  startsAt?: string;
  endsAt?: string;
  venueId?: string;
  governorateId?: string;
  image?: string;
  tagIds?: string[];
}

export interface CreateTicketTypeRequest {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface UpdateTicketTypeRequest {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
}

export const eventsApi = {
  listCategories: () =>
    request<Category[]>("/events/categories"),

  listTags: () =>
    request<Tag[]>("/events/tags"),

  listMyEvents: (token: string, page = 1, limit = 20) =>
    request<any>(`/events/my?page=${page}&limit=${limit}`, { token }),

  createEvent: (data: CreateEventRequest, token: string) =>
    request<Event>("/events", { method: "POST", body: data, token }),

  listPublicEvents: (page = 1, limit = 20) =>
    request<any>(`/events?page=${page}&limit=${limit}`),

  getMyEvent: (id: string, token: string) =>
    request<Event>(`/events/my/${id}`, { token }),

  updateMyEvent: (id: string, data: UpdateEventRequest, token: string) =>
    request<Event>(`/events/my/${id}`, { method: "PATCH", body: data, token }),

  submitEventForReview: (id: string, token: string) =>
    request<Event>(`/events/my/${id}/submit`, { method: "POST", token }),

  cancelEvent: (id: string, reason: string, token: string) =>
    request<any>(`/events/my/${id}/cancel`, {
      method: "POST",
      body: { reason },
      token,
    }),

  createTicketType: (eventId: string, data: CreateTicketTypeRequest, token: string) =>
    request<TicketType>(`/events/my/${eventId}/ticket-types`, {
      method: "POST",
      body: data,
      token,
    }),

  updateTicketType: (
    eventId: string,
    ttId: string,
    data: UpdateTicketTypeRequest,
    token: string
  ) =>
    request<TicketType>(`/events/my/${eventId}/ticket-types/${ttId}`, {
      method: "PATCH",
      body: data,
      token,
    }),

  deleteTicketType: (eventId: string, ttId: string, token: string) =>
    request<any>(`/events/my/${eventId}/ticket-types/${ttId}`, {
      method: "DELETE",
      token,
    }),

  getPublicEvent: (id: string) =>
    request<Event>(`/events/${id}`),

  // Admin
  listAdmin: (page = 1, limit = 20, token: string) =>
    request<any>(`/admin/events?page=${page}&limit=${limit}`, { token }),

  listPendingAdmin: (page = 1, limit = 20, token: string) =>
    request<any>(`/admin/events/pending?page=${page}&limit=${limit}`, { token }),

  getAdmin: (id: string, token: string) =>
    request<Event>(`/admin/events/${id}`, { token }),

  createAdmin: (data: CreateEventRequest, token: string) =>
    request<Event>("/admin/events", { method: "POST", body: data, token }),

  updateAdmin: (id: string, data: UpdateEventRequest, token: string) =>
    request<Event>(`/admin/events/${id}`, { method: "PATCH", body: data, token }),

  deleteAdmin: (id: string, token: string) =>
    request<any>(`/admin/events/${id}`, { method: "DELETE", token }),

  approveAdmin: (id: string, token: string) =>
    request<Event>(`/admin/events/${id}/approve`, { method: "POST", token }),

  rejectAdmin: (id: string, reason: string, token: string) =>
    request<any>(`/admin/events/${id}/reject`, {
      method: "POST",
      body: { reason },
      token,
    }),
};

// ─── Orders API ──────────────────────────────────────────

export interface Order {
  id: string;
  orderNumber?: string;
  userId: string;
  eventId: string;
  status:
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED"
    | "CANCELLED";
  total: number;
  subtotal?: number;
  serviceFee?: number;
  promoDiscount?: number;
  loyaltyDiscount?: number;
  paymentMethod?: string;
  paymobTransactionId?: string;
  canIssueRefund?: boolean;
  user?: Record<string, unknown>;
  event?: Record<string, unknown>;
  items: Array<{
    ticketTypeId: string;
    ticketType?: Record<string, unknown>;
    ticketTypeName?: string;
    quantity: number;
    price: number;
    subtotal?: number;
  }>;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateOrderRequest {
  eventId: string;
  items: Array<{
    ticketTypeId: string;
    quantity: number;
  }>;
}

export interface OrdersListFilters {
  status?: string;
  eventId?: string;
  userPhone?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  orderNumber?: string;
}

function buildOrdersQuery(page: number, limit: number, filters?: OrdersListFilters) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters?.status) params.set("status", filters.status);
  if (filters?.eventId) params.set("eventId", filters.eventId);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.orderNumber) params.set("orderNumber", filters.orderNumber);
  if (filters?.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters?.userPhone) params.set("userPhone", filters.userPhone);
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  return params.toString();
}

export const ordersApi = {
  listMyOrders: (token: string, page = 1, limit = 20, filters?: OrdersListFilters) =>
    request<any>(`/orders/my?${buildOrdersQuery(page, limit, filters)}`, { token }),

  createOrder: (data: CreateOrderRequest, token: string) =>
    request<Order>("/orders", { method: "POST", body: data, token }),

  getMyOrder: (id: string, token: string) =>
    request<Order>(`/orders/my/${id}`, { token }),

  mockPayOrder: (id: string, paymentMethod: string, token: string) =>
    request<Order>(`/orders/my/${id}/mock-pay`, {
      method: "POST",
      body: { paymentMethod },
      token,
    }),

  cancelOrder: (id: string, token: string) =>
    request<any>(`/orders/my/${id}/cancel`, { method: "POST", token }),

  // Admin
  listAdmin: (page = 1, limit = 20, token: string, filters?: OrdersListFilters) =>
    request<any>(`/admin/orders?${buildOrdersQuery(page, limit, filters)}`, { token }),

  getAdmin: (id: string, token: string) =>
    request<Order>(`/admin/orders/${id}`, { token }),

  refundAdmin: (id: string, token: string) =>
    request<any>(`/admin/orders/${id}/refund`, { method: "POST", token }),

  cancelAdmin: (id: string, token: string) =>
    request<any>(`/admin/orders/${id}/cancel`, { method: "POST", token }),
};

// ─── Tickets API ────────────────────────────────────────

export interface Ticket {
  id: string;
  orderId: string;
  ticketTypeId: string;
  eventId: string;
  qrCode: string;
  status: "VALID" | "USED" | "CANCELLED";
  createdAt: string;
}

export const ticketsApi = {
  listMyTickets: (token: string, page = 1, limit = 20) =>
    request<any>(`/tickets/my?page=${page}&limit=${limit}`, { token }),

  getMyTicket: (id: string, token: string) =>
    request<Ticket>(`/tickets/my/${id}`, { token }),
};

// ─── Categories API ────────────────────────────────────

export const categoriesApi = {
  listPublic: () =>
    request<Category[]>("/events/categories"),

  // Admin
  listAdmin: (token: string) =>
    request<Category[]>("/admin/categories", { token }),

  createAdmin: (data: any, token: string) =>
    request<Category>("/admin/categories", { method: "POST", body: data, token }),

  updateAdmin: (id: string, data: any, token: string) =>
    request<Category>(`/admin/categories/${id}`, { method: "PATCH", body: data, token }),

  deleteAdmin: (id: string, token: string) =>
    request<any>(`/admin/categories/${id}`, { method: "DELETE", token }),
};

// ─── Tags API ──────────────────────────────────────────

export const tagsApi = {
  listPublic: () =>
    request<Tag[]>("/events/tags"),

  // Admin
  listAdmin: async (token: string) => {
    const response = await request<{ success: boolean; data: Tag[] }>(
      "/admin/tags",
      { token }
    );
    return response.data || [];
  },

  createAdmin: (data: any, token: string) =>
    request<Tag>("/admin/tags", { method: "POST", body: data, token }),

  updateAdmin: (id: string, data: any, token: string) =>
    request<Tag>(`/admin/tags/${id}`, { method: "PATCH", body: data, token }),

  deleteAdmin: (id: string, token: string) =>
    request<any>(`/admin/tags/${id}`, { method: "DELETE", token }),
};

// ─── Payment Methods API ────────────────────────────────

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  enabled: boolean;
  config?: Record<string, any>;
  createdAt: string;
}

export const paymentMethodsApi = {
  // Admin
  listAdmin: (token: string) =>
    request<PaymentMethod[]>("/admin/payment-methods", { token }),

  getAdmin: (id: string, token: string) =>
    request<PaymentMethod>(`/admin/payment-methods/${id}`, { token }),

  createAdmin: (data: any, token: string) =>
    request<PaymentMethod>("/admin/payment-methods", { method: "POST", body: data, token }),

  updateAdmin: (id: string, data: any, token: string) =>
    request<PaymentMethod>(`/admin/payment-methods/${id}`, { method: "PATCH", body: data, token }),

  deleteAdmin: (id: string, token: string) =>
    request<any>(`/admin/payment-methods/${id}`, { method: "DELETE", token }),
};

// ─── Admin Dashboard API ────────────────────────────────

export interface DashboardStats {
  totalOrganizers: number;
  pendingOrganizers: number;
  totalEvents: number;
  pendingEvents: number;
  totalUsers: number;
  todayOrders: number;
  todayRevenue: number;
}

export const adminApi = {
  getDashboardStats: (token: string) =>
    request<DashboardStats>("/admin/dashboard/stats", { token }),

  // Categories
  listCategories: (token: string) =>
    request<Category[]>("/admin/categories", { token }),

  createCategory: (data: any, token: string) =>
    request<Category>("/admin/categories", { method: "POST", body: data, token }),

  updateCategory: (id: string, data: any, token: string) =>
    request<Category>(`/admin/categories/${id}`, { method: "PATCH", body: data, token }),

  deleteCategory: (id: string, token: string) =>
    request<any>(`/admin/categories/${id}`, { method: "DELETE", token }),

  // Tags
  listTags: (token: string) =>
    request<Tag[]>("/admin/tags", { token }),

  createTag: (data: any, token: string) =>
    request<Tag>("/admin/tags", { method: "POST", body: data, token }),

  updateTag: (id: string, data: any, token: string) =>
    request<Tag>(`/admin/tags/${id}`, { method: "PATCH", body: data, token }),

  deleteTag: (id: string, token: string) =>
    request<any>(`/admin/tags/${id}`, { method: "DELETE", token }),

  // Users
  listUsers: (token: string, page = 1, limit = 20) =>
    request<any>(`/admin/users?page=${page}&limit=${limit}`, { token }),

  getUser: (id: string, token: string) =>
    request<UserProfile>(`/admin/users/${id}`, { token }),

  suspendUser: (id: string, reason: string, token: string) =>
    request<any>(`/admin/users/${id}/suspend`, {
      method: "POST",
      body: { reason },
      token,
    }),

  banUser: (id: string, reason: string, token: string) =>
    request<any>(`/admin/users/${id}/ban`, { method: "POST", body: { reason }, token }),

  reactivateUser: (id: string, token: string) =>
    request<any>(`/admin/users/${id}/reactivate`, { method: "POST", token }),
};

// ─── Health Check ───────────────────────────────────────

export const healthApi = {
  check: () =>
    request<{ db: boolean; redis: boolean }>("/health"),
};
