import { BookingRequestInternal } from "./BookingRequestInternal";
import { BookingRequestResource } from "./BookingRequestResource";
import { BookingResponse } from "./BookingResponse";

export interface BookingResultPage {
  request: BookingRequestInternal;
  response: BookingResponse;
  resource: BookingRequestResource;
}
