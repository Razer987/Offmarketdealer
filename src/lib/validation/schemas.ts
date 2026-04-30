import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '@/lib/utils/constants';

// ─── Auth ─────────────────────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mindestens ${PASSWORD_MIN_LENGTH} Zeichen`)
  .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe')
  .regex(/[a-z]/, 'Mindestens ein Kleinbuchstabe')
  .regex(/[0-9]/, 'Mindestens eine Zahl')
  .regex(/[^A-Za-z0-9]/, 'Mindestens ein Sonderzeichen');

export const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').toLowerCase(),
  password: passwordSchema,
  inviteCode: z
    .string()
    .length(6, '6-stelliger Code erforderlich')
    .regex(/^[A-Z2-9]{6}$/i, 'Ungültiger Code'),
});

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').toLowerCase(),
  password: z.string().min(1, 'Passwort erforderlich'),
  totpToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

// ─── Invite ────────────────────────────────────────────────────────────────────

export const validateInviteSchema = z.object({
  code: z
    .string()
    .length(6, '6-stelliger Code erforderlich')
    .regex(/^[A-Z2-9]{6}$/i, 'Ungültiger Code-Format'),
});

export const createInviteSchema = z.object({
  label: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

// ─── Listings ──────────────────────────────────────────────────────────────────

const conditionRatingEnum = z.enum(['CONCOURS', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'RESTORATION']);
const listingStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'WITHDRAWN']);

export const createListingSchema = z.object({
  teaserTitle: z.string().min(5).max(200),
  teaserDescription: z.string().min(20).max(1000),
  teaserImageUrl: z.string().min(1),

  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1885).max(new Date().getFullYear() + 1),

  engineDisplacement: z.number().int().positive().optional(),
  enginePower: z.number().int().positive().optional(),
  acceleration: z.number().positive().optional(),
  topSpeed: z.number().int().positive().optional(),

  mileageRange: z.string().max(100).optional(),
  conditionRating: conditionRatingEnum,

  priceRangeMin: z.number().positive().optional(),
  priceRangeMax: z.number().positive().optional(),
  priceCurrency: z.string().length(3).default('EUR'),

  generalDescription: z.string().min(20).max(5000),
  highlights: z.array(z.string().max(200)).max(10).default([]),

  internalNotes: z.string().max(5000).optional(),
  internalSellerInfo: z.string().max(5000).optional(),

  status: listingStatusEnum.default('DRAFT'),
});

export const updateListingSchema = createListingSchema.partial();

export const listingFiltersSchema = z.object({
  brand: z.string().optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  condition: conditionRatingEnum.optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// ─── Inquiries ────────────────────────────────────────────────────────────────

const inquiryTypeEnum = z.enum(['LISTING_INQUIRY', 'ASSESSMENT_REQUEST', 'GENERAL']);
const contactMethodEnum = z.enum(['EMAIL', 'PHONE', 'WHATSAPP']);

export const createInquirySchema = z.object({
  type: inquiryTypeEnum,
  listingId: z.string().cuid().optional(),
  vehicleBrand: z.string().max(100).optional(),
  vehicleModel: z.string().max(100).optional(),
  vehicleYear: z.number().int().min(1885).max(2030).optional(),
  vehicleMileage: z.number().int().nonnegative().optional(),
  vehicleVin: z.string().max(17).optional(),
  vehicleLocation: z.string().max(200).optional(),
  message: z.string().min(20).max(5000),
  contactPhone: z
    .string()
    .max(30)
    .regex(/^[+\d\s\-()]+$/, 'Ungültige Telefonnummer')
    .optional(),
  preferredContact: contactMethodEnum.default('EMAIL'),
});

export const updateInquiryStatusSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED', 'ARCHIVED']),
  adminNotes: z.string().max(5000).optional(),
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  totpToken: z.string().length(6).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

// ─── Export all types ─────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ListingFiltersInput = z.infer<typeof listingFiltersSchema>;
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
