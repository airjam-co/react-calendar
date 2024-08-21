import { AirJamFilter, CalendarEvent, CalendarResource, EventReservation, EventReservationStatus, PaginationStyle, PrivateCalendarResource } from "@airjam/types"
import { CalendarViewType as ViewType } from '@airjam/types';

export interface Props {
  id: string;
  resourceId?: string;
  authToken?: string;
  host?: string;
  location?: string;
  showDate?: Date;
  showEndDate?: Date;
  viewAs?: ViewType;
  page?: number;
  paginationStyle?: PaginationStyle;
  locale?: string
  resultsPerPage?: number;
  descriptionLength?: number;
  priceMin?: number;
  priceMax?: number;
  maxDistance?: number;
  minDistance?: number;
  customFilters?: AirJamFilter;
  reservationStatusFilter?: EventReservationStatus;
  renderEventFunc?: (event: CalendarEvent, index: number) => any;
  renderResourceFunc?: (resource: CalendarResource, index: number, toggleVisibility?: () => Promise<string>) => any;
  renderEventReservationFunc?: (reservation: EventReservation, index: number, acceptButton: React.JSX.Element, rejectButton: React.JSX.Element) => any;
  onPagePressed?: (newPage: number) => void;
  onResourceSelected?: (resource: PrivateCalendarResource) => void;

  // mode-specific props
  bookingDefaultName?: string;
  bookingDefaultEmail?: string;

  // geo-spatial props
  latitude?: number;
  longitude?: number;
  googleMapsApiKey?: string;
  defaultMapZoom?: number;
  mapMarkerImageUrl?: string;
  mapMarkerImageMouseOverUrl?: string;
  mapMarkerImageWidth?: number;
  mapMarkerImageHeight?: number;
  mapMarkerLabelFunc?: (resource: CalendarResource, index: number) => string | google.maps.MarkerLabel | undefined;
  paymentProcessorPublicKey?: string;
  renderMapMarkerInfoWindowFunc?: (resource: CalendarResource) => React.JSX.Element;
}
