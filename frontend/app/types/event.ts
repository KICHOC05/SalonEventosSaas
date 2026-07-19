// =====================================================
// EVENT TYPES
// =====================================================

export type EventStatus =
  | "PENDING_DEPOSIT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface EventCalendarResponse {
  publicId: string;
  customerName: string;
  childName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
}

export interface EventResponse {
  publicId: string;
  customerName: string;
  phone: string;
  childName: string;
  childAge: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestChildren: number;
  guestAdults: number;
  notes: string;
  packageProductPublicId: string;
  packageName: string;
  eventPrice: number;
  depositAmount: number;
  remainingAmount: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityResponse {
  available: boolean;
}

export interface CreateEventRequest {
  customerName: string;
  phone: string;
  childName: string;
  childAge: number;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestChildren: number;
  guestAdults: number;
  notes?: string;
  packageProductPublicId: string;
  depositAmount: number;
}

export interface UpdateEventRequest {
  customerName?: string;
  phone?: string;
  childName?: string;
  childAge?: number;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  guestChildren?: number;
  guestAdults?: number;
  notes?: string;
  packageProductPublicId?: string;
  depositAmount?: number;
}

// =====================================================
// RESCHEDULE
// =====================================================

export interface RescheduleEventRequest {
  eventDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface EventRescheduleHistoryResponse {
  publicId: string;
  oldEventDate: string;
  oldStartTime: string;
  oldEndTime: string;
  newEventDate: string;
  newStartTime: string;
  newEndTime: string;
  reason: string;
  changedByName: string;
  changedAt: string;
}

// =====================================================
// EVENT PAYMENTS
// =====================================================

export type EventPaymentMethod = "CASH" | "CARD" | "TRANSFER";

export interface RegisterEventPaymentRequest {
  amount: number;
  paymentMethod: EventPaymentMethod;
  reference?: string;
  notes?: string;
}

export interface EventPaymentResponse {
  publicId: string;
  eventPublicId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  receivedByUserPublicId: string;
  receivedByUserEmail: string;
  paidAt: string;
}