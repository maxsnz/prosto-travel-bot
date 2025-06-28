// Base types for API responses
export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
}

// Types for cities
export interface CityAttributes {
  name: string;
  description?: string;
  isComingSoon?: boolean;
}

export interface CityData {
  id: number;
  attributes: CityAttributes;
}

export interface City {
  id: number;
  name: string;
  description?: string;
}

// Types for places
export interface PlaceTag {
  name: string;
}

export interface PlaceAttributes {
  name: string;
  address: string;
  description: string;
  mapLink: string;
  coords: string;
  imageUrl: string;
  tags: PlaceTag[];
}

export interface PlaceData {
  id: number;
  attributes: PlaceAttributes;
}

export interface Place {
  id: number;
  name: string;
  address: string;
  description: string;
  mapLink: string;
  coords: string;
  imageUrl: string;
  tags: string[];
}

// Types for users
export interface User {
  id: number;
  telegramId: string;
  username?: string;
  firstName?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserParams {
  telegramId: number;
  username?: string;
  firstName?: string;
  email?: string;
}

// Types for guides
export interface Guide {
  id: number;
  userId: number;
  cityId: number;
  publicId?: string;
  htmlContent?: string;
  status: "draft" | "paid" | "generating" | "ready" | "failed" | "delivered";
}

export interface GuideAttributes {
  userId: number;
  cityId: number;
  publicId?: string;
  htmlContent?: string;
  status: "draft" | "paid" | "generating" | "ready" | "failed" | "delivered";
}

export interface GuideData {
  id: number;
  attributes: GuideAttributes;
}

export interface CreateGuideParams {
  userId: number;
  cityId: number;
}

export interface UpdateGuideParams {
  status?: "draft" | "paid" | "generating" | "ready" | "failed" | "delivered";
}

// Types for payments
export interface Payment {
  id: number;
  guideId: number;
  userId: number;
  status: "pending" | "paid" | "failed" | "cancelled";
}

export interface PaymentAttributes {
  guideId: number;
  userId: number;
  status: "pending" | "paid" | "failed" | "cancelled";
}

export interface PaymentData {
  id: number;
  attributes: PaymentAttributes;
}

export interface CreatePaymentParams {
  guideId: number;
  userId: number;
}

export interface UpdatePaymentParams {
  status?: "pending" | "paid" | "failed" | "cancelled";
  amount?: number;
  telegram_payment_charge_id?: string;
  provider_payment_charge_id?: string;
  invoice_payload?: string;
}
