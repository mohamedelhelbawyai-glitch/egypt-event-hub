
-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE public.user_gender AS ENUM ('MALE', 'FEMALE', 'PREFER_NOT_TO_SAY');
CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');
CREATE TYPE public.user_locale AS ENUM ('AR', 'EN');
CREATE TYPE public.admin_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'SUPPORT', 'CONTENT_MANAGER');
CREATE TYPE public.organizer_type AS ENUM ('COMPANY', 'INDIVIDUAL');
CREATE TYPE public.organizer_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED');
CREATE TYPE public.venue_type AS ENUM ('STADIUM', 'THEATER', 'HALL', 'ARENA', 'OUTDOOR', 'OTHER');
CREATE TYPE public.venue_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');
CREATE TYPE public.event_format AS ENUM ('GA', 'SEATED', 'ONLINE', 'HYBRID', 'FREE');
CREATE TYPE public.event_visibility AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE public.event_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ON_SALE', 'SOLD_OUT', 'LIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE public.ticket_visual_type AS ENUM ('IMAGE', 'COLOR');
CREATE TYPE public.ticket_visibility AS ENUM ('PUBLIC', 'HIDDEN');
CREATE TYPE public.created_by_role AS ENUM ('ADMIN', 'ORGANIZER');
CREATE TYPE public.order_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');
CREATE TYPE public.payment_method_enum AS ENUM ('CARD', 'VODAFONE_CASH', 'FAWRY', 'INSTAPAY');
CREATE TYPE public.payment_type AS ENUM ('CHARGE', 'REFUND');
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE public.payout_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');
CREATE TYPE public.seat_hold_status AS ENUM ('ACTIVE', 'CONVERTED', 'EXPIRED', 'RELEASED');
CREATE TYPE public.scan_result AS ENUM ('SUCCESS', 'ALREADY_SCANNED', 'INVALID', 'WRONG_EVENT', 'RESTRICTION_FAILED', 'TICKET_CANCELLED');
CREATE TYPE public.loyalty_txn_type AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT');
CREATE TYPE public.ticket_status AS ENUM ('ACTIVE', 'SCANNED', 'CANCELLED', 'REFUNDED');
CREATE TYPE public.promo_discount_type AS ENUM ('PERCENTAGE', 'FIXED_EGP');
CREATE TYPE public.promo_applicable_to AS ENUM ('ALL', 'EVENT', 'TICKET_TYPE');
CREATE TYPE public.referral_reward_type AS ENUM ('EARN', 'DISCOUNT');
CREATE TYPE public.referral_status AS ENUM ('PENDING', 'CREDITED', 'EXPIRED');
CREATE TYPE public.refund_policy_type AS ENUM ('FULL', 'PARTIAL', 'NO_REFUND');
CREATE TYPE public.payment_provider_enum AS ENUM ('PAYMOB_CARD', 'PAYMOB_VODAFONE', 'PAYMOB_FAWRY', 'PAYMOB_INSTAPAY');

-- =============================================
-- HELPER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- DYNAMIC CONFIG TABLES
-- =============================================

CREATE TABLE public.governorates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  governorate_id UUID NOT NULL REFERENCES public.governorates(id) ON DELETE CASCADE,
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.event_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  icon_url TEXT,
  color_hex VARCHAR(7),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  usage_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.venue_facilities_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ticket_type_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  visual_type public.ticket_visual_type NOT NULL,
  visual_value VARCHAR NOT NULL,
  default_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audience_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label_ar VARCHAR NOT NULL,
  label_en VARCHAR NOT NULL,
  requires_field VARCHAR NOT NULL,
  validation_rule JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_methods_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider public.payment_provider_enum NOT NULL,
  label_ar VARCHAR NOT NULL,
  label_en VARCHAR NOT NULL,
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_amount_egp DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.commission_fee_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trust_tier SMALLINT NOT NULL CHECK (trust_tier BETWEEN 0 AND 3),
  commission_pct DECIMAL(5,2) NOT NULL,
  service_fee_egp DECIMAL(10,2) NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_commission_fee_rules_tier_current ON public.commission_fee_rules(trust_tier, is_current);

CREATE TABLE public.refund_policy_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  type public.refund_policy_type NOT NULL,
  deadline_days_before INT,
  refund_percentage DECIMAL(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.loyalty_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  earn_rate DECIMAL(5,2) NOT NULL,
  redeem_rate DECIMAL(5,2) NOT NULL,
  expiry_days INT,
  min_redeem_points INT NOT NULL DEFAULT 0,
  max_redeem_pct_per_order DECIMAL(5,2) NOT NULL DEFAULT 100,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR NOT NULL UNIQUE,
  value BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by_admin_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- CORE DOMAIN TABLES
-- =============================================

CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  role public.admin_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_id UUID REFERENCES public.admin_users(id),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.homepage_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_type VARCHAR,
  link_target TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by_admin_id UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_homepage_banners_active ON public.homepage_banners(is_active, starts_at, ends_at);

CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR NOT NULL UNIQUE,
  email VARCHAR UNIQUE,
  name_ar VARCHAR,
  name_en VARCHAR,
  gender public.user_gender,
  date_of_birth DATE,
  avatar_url TEXT,
  loyalty_points INT NOT NULL DEFAULT 0,
  referral_code VARCHAR NOT NULL UNIQUE,
  referred_by_user_id UUID REFERENCES public.users(id),
  locale public.user_locale NOT NULL DEFAULT 'AR',
  phone_verified_at TIMESTAMPTZ,
  status public.user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_referral_code ON public.users(referral_code);

CREATE TABLE public.organizers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  display_name_ar VARCHAR NOT NULL,
  display_name_en VARCHAR NOT NULL,
  bio_ar TEXT,
  bio_en TEXT,
  logo_url TEXT,
  banner_url TEXT,
  type public.organizer_type NOT NULL,
  trust_tier SMALLINT NOT NULL DEFAULT 0 CHECK (trust_tier BETWEEN 0 AND 3),
  verified_badge BOOLEAN NOT NULL DEFAULT false,
  commercial_reg_no VARCHAR,
  tax_id VARCHAR,
  bank_account_enc TEXT,
  approved_by_id UUID REFERENCES public.admin_users(id),
  status public.organizer_status NOT NULL DEFAULT 'PENDING',
  social_links JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.organizer_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by_admin_id UUID REFERENCES public.admin_users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organizer_id, user_id)
);

CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  type public.venue_type NOT NULL,
  governorate_id UUID NOT NULL REFERENCES public.governorates(id),
  city_id UUID REFERENCES public.cities(id),
  address_ar VARCHAR NOT NULL,
  address_en VARCHAR NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  total_capacity INT NOT NULL,
  seatsio_chart_key VARCHAR,
  sections JSONB,
  photos TEXT[],
  google_maps_url TEXT,
  submitted_by_org_id UUID REFERENCES public.organizers(id),
  approved_by_admin_id UUID REFERENCES public.admin_users(id),
  status public.venue_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id),
  venue_id UUID REFERENCES public.venues(id),
  category_id UUID NOT NULL REFERENCES public.event_categories(id),
  audience_restriction_id UUID REFERENCES public.audience_restrictions(id),
  refund_policy_id UUID REFERENCES public.refund_policy_templates(id),
  approved_by_admin_id UUID REFERENCES public.admin_users(id),
  title_ar VARCHAR NOT NULL,
  title_en VARCHAR NOT NULL,
  description_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  format public.event_format NOT NULL,
  cover_image_url TEXT NOT NULL,
  gallery_urls TEXT[],
  stream_url TEXT,
  seatsio_event_key VARCHAR,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  doors_open_at TIMESTAMPTZ,
  visibility public.event_visibility NOT NULL DEFAULT 'PUBLIC',
  private_invite_token VARCHAR UNIQUE,
  custom_refund_policy JSONB,
  status public.event_status NOT NULL DEFAULT 'DRAFT',
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_organizer_status ON public.events(organizer_id, status, format, starts_at, category_id);

CREATE TABLE public.event_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE(event_id, tag_id)
);

CREATE TABLE public.venue_facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.venue_facilities_list(id) ON DELETE CASCADE,
  UNIQUE(venue_id, facility_id)
);

CREATE TABLE public.user_followed_organizers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organizer_id)
);

-- =============================================
-- TICKETING ENGINE
-- =============================================

CREATE TABLE public.ticket_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.ticket_type_templates(id),
  name_ar VARCHAR NOT NULL,
  name_en VARCHAR NOT NULL,
  visual_type public.ticket_visual_type NOT NULL,
  visual_value VARCHAR NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_total INT NOT NULL,
  quantity_sold INT NOT NULL DEFAULT 0,
  quantity_reserved INT NOT NULL DEFAULT 0,
  max_per_order INT NOT NULL DEFAULT 10,
  people_per_ticket INT NOT NULL DEFAULT 1,
  sale_starts_at TIMESTAMPTZ NOT NULL,
  sale_ends_at TIMESTAMPTZ NOT NULL,
  perks TEXT[],
  created_by public.created_by_role NOT NULL,
  visibility public.ticket_visibility NOT NULL DEFAULT 'PUBLIC',
  is_seated BOOLEAN NOT NULL DEFAULT false,
  seatsio_category_key VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_types_event ON public.ticket_types(event_id, sale_starts_at, sale_ends_at);

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  event_id UUID NOT NULL REFERENCES public.events(id),
  subtotal DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  loyalty_points_used INT NOT NULL DEFAULT 0,
  loyalty_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  promo_code_id UUID,
  payment_method public.payment_method_enum,
  payment_provider_ref VARCHAR,
  seatsio_hold_token VARCHAR,
  status public.order_status NOT NULL DEFAULT 'PENDING',
  refund_reason TEXT,
  refunded_by_admin_id UUID REFERENCES public.admin_users(id),
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON public.orders(user_id, event_id, status, order_number);

CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  seat_labels TEXT[]
);

CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  event_id UUID NOT NULL REFERENCES public.events(id),
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id),
  qr_code VARCHAR NOT NULL UNIQUE,
  seat_label VARCHAR,
  seat_section VARCHAR,
  seat_row VARCHAR,
  stream_access_token VARCHAR,
  status public.ticket_status NOT NULL DEFAULT 'ACTIVE',
  scanned_at TIMESTAMPTZ,
  scanned_by_staff_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_qr ON public.tickets(qr_code);
CREATE INDEX idx_tickets_user ON public.tickets(user_id, event_id);

CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  paymob_txn_id VARCHAR,
  paymob_order_id VARCHAR,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR NOT NULL DEFAULT 'EGP',
  payment_method public.payment_method_enum,
  type public.payment_type NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  gateway_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.organizer_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id),
  event_id UUID NOT NULL UNIQUE REFERENCES public.events(id),
  gross_revenue DECIMAL(10,2) NOT NULL,
  commission_pct DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'PENDING',
  triggered_by_admin_id UUID REFERENCES public.admin_users(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.seat_holds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  event_id UUID NOT NULL REFERENCES public.events(id),
  seatsio_hold_token VARCHAR NOT NULL,
  seat_labels TEXT[] NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status public.seat_hold_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_seat_holds_expiry ON public.seat_holds(expires_at, event_id);

CREATE TABLE public.ticket_scan_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id),
  scanned_by_user_id UUID NOT NULL REFERENCES public.users(id),
  event_id UUID NOT NULL REFERENCES public.events(id),
  result public.scan_result NOT NULL,
  failure_reason TEXT,
  device_info JSONB,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ticket_scan_logs ON public.ticket_scan_logs(ticket_id, event_id);

CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id),
  order_id UUID REFERENCES public.orders(id),
  type public.loyalty_txn_type NOT NULL,
  points INT NOT NULL,
  balance_after INT NOT NULL,
  description VARCHAR NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- GROWTH TABLES
-- =============================================

CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR NOT NULL UNIQUE,
  discount_type public.promo_discount_type NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  max_uses INT,
  uses_count INT NOT NULL DEFAULT 0,
  max_uses_per_user INT NOT NULL DEFAULT 1,
  applicable_to public.promo_applicable_to NOT NULL DEFAULT 'ALL',
  event_id UUID REFERENCES public.events(id),
  ticket_type_id UUID REFERENCES public.ticket_types(id),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_by public.created_by_role NOT NULL,
  created_by_organizer_id UUID REFERENCES public.organizers(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK from orders to promo_codes now that promo_codes exists
ALTER TABLE public.orders ADD CONSTRAINT orders_promo_code_fk FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id);

CREATE TABLE public.promo_code_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  discount_applied DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id, order_id)
);

CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL REFERENCES public.users(id),
  referee_user_id UUID NOT NULL REFERENCES public.users(id),
  qualifying_order_id UUID REFERENCES public.orders(id),
  referrer_reward_type public.referral_reward_type NOT NULL,
  referrer_reward_value DECIMAL(10,2) NOT NULL,
  referee_discount_egp DECIMAL(10,2) NOT NULL DEFAULT 0,
  status public.referral_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizers_updated_at BEFORE UPDATE ON public.organizers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ticket_types_updated_at BEFORE UPDATE ON public.ticket_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizer_payouts_updated_at BEFORE UPDATE ON public.organizer_payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON public.promo_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_referral_rewards_updated_at BEFORE UPDATE ON public.referral_rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_governorates_updated_at BEFORE UPDATE ON public.governorates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_categories_updated_at BEFORE UPDATE ON public.event_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_venue_facilities_list_updated_at BEFORE UPDATE ON public.venue_facilities_list FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ticket_type_templates_updated_at BEFORE UPDATE ON public.ticket_type_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_audience_restrictions_updated_at BEFORE UPDATE ON public.audience_restrictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_methods_config_updated_at BEFORE UPDATE ON public.payment_methods_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commission_fee_rules_updated_at BEFORE UPDATE ON public.commission_fee_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_refund_policy_templates_updated_at BEFORE UPDATE ON public.refund_policy_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loyalty_rules_updated_at BEFORE UPDATE ON public.loyalty_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_homepage_banners_updated_at BEFORE UPDATE ON public.homepage_banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_facilities_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_followed_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_type_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audience_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_policy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Service role (server functions) can access everything - handled by Supabase automatically
-- For the admin panel, we'll use server functions with supabaseAdmin (service role)
-- Public read policies for config tables used by mobile app
CREATE POLICY "Public read event_categories" ON public.event_categories FOR SELECT USING (true);
CREATE POLICY "Public read tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Public read governorates" ON public.governorates FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Public read venue_facilities_list" ON public.venue_facilities_list FOR SELECT USING (true);
CREATE POLICY "Public read payment_methods_config" ON public.payment_methods_config FOR SELECT USING (true);
CREATE POLICY "Public read refund_policy_templates" ON public.refund_policy_templates FOR SELECT USING (true);
CREATE POLICY "Public read feature_flags" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "Public read ticket_type_templates" ON public.ticket_type_templates FOR SELECT USING (true);
CREATE POLICY "Public read audience_restrictions" ON public.audience_restrictions FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (status IN ('PUBLISHED', 'ON_SALE', 'SOLD_OUT', 'LIVE'));
CREATE POLICY "Public read venues" ON public.venues FOR SELECT USING (status = 'APPROVED');
CREATE POLICY "Public read organizers" ON public.organizers FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Public read ticket_types" ON public.ticket_types FOR SELECT USING (visibility = 'PUBLIC');
CREATE POLICY "Public read event_tags" ON public.event_tags FOR SELECT USING (true);
CREATE POLICY "Public read venue_facilities" ON public.venue_facilities FOR SELECT USING (true);
CREATE POLICY "Public read homepage_banners" ON public.homepage_banners FOR SELECT USING (is_active = true);
CREATE POLICY "Public read loyalty_rules" ON public.loyalty_rules FOR SELECT USING (is_current = true);
CREATE POLICY "Public read commission_fee_rules" ON public.commission_fee_rules FOR SELECT USING (is_current = true);
