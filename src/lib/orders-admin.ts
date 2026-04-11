export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "CANCELLED";

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus | string;
  amountEgp: number;
  createdAt: string;
  userPhone: string;
  eventTitle: string;
  eventId: string;
  paymentMethod: string;
  canIssueRefund: boolean;
  raw: Record<string, unknown>;
}

export interface AdminOrderLineItem {
  id: string;
  ticketType: string;
  quantity: number;
  unitPriceEgp: number;
  subtotalEgp: number;
}

export interface AdminOrderDetails {
  id: string;
  orderNumber: string;
  status: OrderStatus | string;
  createdAt: string;
  userPhone: string;
  eventTitle: string;
  eventId: string;
  paymentMethod: string;
  paymobTransactionId: string;
  canIssueRefund: boolean;
  subtotalEgp: number;
  promoDiscountEgp: number;
  loyaltyDiscountEgp: number;
  serviceFeeEgp: number;
  totalEgp: number;
  items: AdminOrderLineItem[];
  raw: Record<string, unknown>;
}

export interface AdminOrdersListResult {
  rows: AdminOrderListItem[];
  total: number;
  page: number;
  limit: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function pickRecord(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  for (const key of keys) {
    const value = obj[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return {};
}

function pickArray(obj: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  if (typeof value === "number") return value === 1;
  return false;
}

function normalizeListEntry(source: unknown): AdminOrderListItem {
  const row = asRecord(source);
  const user = pickRecord(row, ["user", "customer", "buyer"]);
  const event = pickRecord(row, ["event"]);
  const payment = pickRecord(row, ["payment", "paymentTransaction", "transaction"]);

  const id = pickString(row, ["id", "orderId"]);
  const orderNumber =
    pickString(row, ["orderNumber", "code", "reference"]) || id;
  const status = pickString(row, ["status"]) || "PENDING";
  const amountEgp = pickNumber(row, ["total", "totalAmount", "totalEgp", "amount"]);
  const createdAt = pickString(row, ["createdAt", "created_at", "date"]);
  const userPhone =
    pickString(row, ["userPhone", "phone"]) || pickString(user, ["phone", "mobile"]);
  const eventTitle =
    pickString(row, ["eventTitle"]) ||
    pickString(event, ["titleEn", "title", "nameEn", "name"]);
  const eventId = pickString(row, ["eventId"]) || pickString(event, ["id"]);
  const paymentMethod =
    pickString(row, ["paymentMethod"]) ||
    pickString(payment, ["method", "paymentMethod", "channel"]) ||
    "N/A";

  const canIssueRefund =
    parseBool(row.canIssueRefund) ||
    parseBool((row.permissions as Record<string, unknown> | undefined)?.canIssueRefund) ||
    parseBool((payment.permissions as Record<string, unknown> | undefined)?.canIssueRefund);

  return {
    id,
    orderNumber,
    status,
    amountEgp,
    createdAt,
    userPhone,
    eventTitle,
    eventId,
    paymentMethod,
    canIssueRefund,
    raw: row,
  };
}

export function normalizeOrdersListResponse(
  source: unknown,
  fallback: { page: number; limit: number }
): AdminOrdersListResult {
  const root = asRecord(source);
  const data = root.data;
  const nested = asRecord(data);

  const rowsSource = Array.isArray(data)
    ? data
    : Array.isArray(nested.data)
      ? nested.data
      : Array.isArray(root.rows)
        ? (root.rows as unknown[])
        : [];

  const rows = rowsSource.map(normalizeListEntry).filter((row) => Boolean(row.id));

  const total =
    pickNumber(root, ["total", "count"]) ||
    pickNumber(nested, ["total", "count"]) ||
    rows.length;
  const page =
    pickNumber(root, ["page"]) || pickNumber(nested, ["page"]) || fallback.page;
  const limit =
    pickNumber(root, ["limit", "pageSize"]) ||
    pickNumber(nested, ["limit", "pageSize"]) ||
    fallback.limit;

  return { rows, total, page, limit };
}

export function normalizeOrderDetails(source: unknown): AdminOrderDetails {
  const row = asRecord(source);
  const listEntry = normalizeListEntry(row);
  const payment = pickRecord(row, ["payment", "paymentTransaction", "transaction"]);
  const discounts = pickRecord(row, ["discounts", "discountBreakdown"]);

  const itemsRaw = pickArray(row, ["items", "orderItems", "lineItems"]);
  const items = itemsRaw.map((entry, index) => {
    const item = asRecord(entry);
    const ticketTypeObj = pickRecord(item, ["ticketType"]);
    const quantity = pickNumber(item, ["quantity", "qty"]);
    const unitPriceEgp = pickNumber(item, ["unitPrice", "price", "unitPriceEgp"]);
    const subtotalEgp =
      pickNumber(item, ["subtotal", "lineTotal", "subtotalEgp"]) ||
      quantity * unitPriceEgp;

    return {
      id: pickString(item, ["id", "ticketTypeId"]) || `${index}`,
      ticketType:
        pickString(item, ["ticketTypeName", "ticketType"]) ||
        pickString(ticketTypeObj, ["nameEn", "name", "title"]) ||
        "Ticket",
      quantity,
      unitPriceEgp,
      subtotalEgp,
    };
  });

  const subtotalEgp =
    pickNumber(row, ["subtotal", "subTotal", "subtotalEgp"]) ||
    items.reduce((sum, item) => sum + item.subtotalEgp, 0);
  const promoDiscountEgp =
    pickNumber(row, ["promoDiscount", "promoDiscountEgp"]) ||
    pickNumber(discounts, ["promo", "promoDiscount", "promoDiscountEgp"]);
  const loyaltyDiscountEgp =
    pickNumber(row, ["loyaltyDiscount", "loyaltyDiscountEgp"]) ||
    pickNumber(discounts, ["loyalty", "loyaltyDiscount", "loyaltyDiscountEgp"]);
  const serviceFeeEgp =
    pickNumber(row, ["serviceFee", "serviceFeeEgp", "fee"]) ||
    pickNumber(discounts, ["serviceFee", "fee"]);
  const totalEgp =
    pickNumber(row, ["total", "totalAmount", "totalEgp"]) ||
    subtotalEgp + serviceFeeEgp - promoDiscountEgp - loyaltyDiscountEgp;

  const paymobTransactionId =
    pickString(row, ["paymobTransactionId", "paymobTxnId"]) ||
    pickString(payment, ["paymobTransactionId", "transactionId", "externalId", "id"]);

  return {
    id: listEntry.id,
    orderNumber: listEntry.orderNumber,
    status: listEntry.status,
    createdAt: listEntry.createdAt,
    userPhone: listEntry.userPhone,
    eventTitle: listEntry.eventTitle,
    eventId: listEntry.eventId,
    paymentMethod: listEntry.paymentMethod,
    paymobTransactionId,
    canIssueRefund: listEntry.canIssueRefund,
    subtotalEgp,
    promoDiscountEgp,
    loyaltyDiscountEgp,
    serviceFeeEgp,
    totalEgp,
    items,
    raw: row,
  };
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.length <= 4) return cleaned || "N/A";
  return `${cleaned.slice(0, 3)}****${cleaned.slice(-3)}`;
}

export function formatEgp(value: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

