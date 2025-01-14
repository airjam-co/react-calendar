import { AirJamFilter, BookingResource, CalendarEvent, CalendarResource, CssTheme, EventReservation, EventReservationStatus, PaginationStyle, PrivateCalendarResource } from "@airjam/types"
import { CalendarViewType as ViewType } from '@airjam/types';
import { ActionType } from "./ActionType";

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
  cssTheme?: CssTheme;
  renderEventFunc?: (event: CalendarEvent, index: number) => any;
  renderResourceFunc?: (resource: CalendarResource, index: number, toggleVisibility?: () => Promise<string>) => any;
  renderEventReservationFunc?: (reservation: EventReservation, index: number, acceptButton: React.JSX.Element, rejectButton: React.JSX.Element, cancelButton: React.JSX.Element) => any;
  renderMyReservationFunc?: (reservation: EventReservation, index: number, cancelButton: React.JSX.Element) => any;
  renderBookingResourcesSelectionFunc?: (resources: BookingResource[], setResourceFunc: (newResourceId: string) => void) => any;
  renderResourceForSingularBookingFunc?: (resource: BookingResource, bookButton: React.JSX.Element, isAvailableToBook: boolean) => any;
  myReservationsHead?: React.JSX.Element;
  onPagePressed?: (newPage: number) => void;
  onResourceSelected?: (resource: PrivateCalendarResource) => void;
  onAction?: (actionType: ActionType, message?: any) => void;
  onCalendarMonthChanged?: (newMonth: Date) => void;
  onBookingStartTimeChanged?: (newBookingStartTime: Date) => void;
  onBookingEndTimeChanged?: (newBookingEndTime: Date) => void;

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
