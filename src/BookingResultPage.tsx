import { CalendarBookingRequest } from "@airjam/types";
import { BookingRequestResource } from "./BookingRequestResource";
import { BookingResponse } from "./BookingResponse";

export interface BookingResultPage {
  request: CalendarBookingRequest;
  response: BookingResponse;
  resource: BookingRequestResource;
}
