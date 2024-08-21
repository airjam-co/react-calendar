import React, { useEffect } from 'react';
import type { BookingRequestResource } from './BookingRequestResource';
import { getReservationPaymentDetail } from './thunk';
import { CalendarBookingRequest, EventReservationPaymentIntentDetail, Translation } from '@airjam/types';
import { ReservationModalParent } from './ReservationModalParent';

interface Props {
  componentId: string;
  locale?: string;
  translation: Translation;
  timezone: string;
  resource: BookingRequestResource;
  paymentProcessorPublicKey?: string; // This must be provided statically during initial load.
  host?: string;
  authToken?: string;
  defaultName?: string;
  defaultEmail?: string;
  onClose?: () => void;
  submitPressed?: (
    resource: BookingRequestResource,
    bookingRequest: CalendarBookingRequest,
  ) => void;
}

export const ReservationModalWrapper = ({
  componentId,
  timezone,
  locale,
  translation,
  resource,
  host,
  authToken,
  defaultEmail,
  defaultName,
  paymentProcessorPublicKey,
  onClose,
  submitPressed,
}: Props) => {
  const [isMounted, setIsMounted] = React.useState<Boolean>(false)
  const [intent, setIntent] = React.useState<EventReservationPaymentIntentDetail | undefined>(undefined);
  const [request, setRequest] = React.useState<CalendarBookingRequest | undefined>(undefined);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      initialize();
    }
  }, []);

  useEffect(() => {
    // initialize();
  }, [componentId, resource, host, authToken]);

  const initialize = () => {
    let requestPayload = {} as CalendarBookingRequest;
    let requestStartTime = new Date();
    let requestEndTime = new Date();

    // load payment detail
    if (resource && resource.startTimeUtc) requestStartTime = new Date(resource.startTimeUtc);
    if (resource && resource.endTimeUtc) requestEndTime = new Date(resource.endTimeUtc);
    requestPayload.id = componentId;
    requestPayload.resourceId = resource.resource._id;
    requestPayload.startTimeUtc = requestStartTime.toISOString();
    requestPayload.endTimeUtc = requestEndTime.toISOString();

    setRequest(requestPayload);
    getReservationPaymentDetail(componentId, requestPayload, host, authToken).then(resp => {
      if (resp) {
        console.log(resp);
        setIntent(resp);
      }
    });
  };

  const renderModal = (): React.JSX.Element => {
    // TODO -- show something when payment detail fails to load
    if (!request || !intent || !intent.total || !intent.paymentProcessor)
        return <span />;
    return <ReservationModalParent
        timezone={timezone}
        resource={resource}
        locale={locale}
        translation={translation}
        paymentProcessorPublicKey={paymentProcessorPublicKey}
        onClose={onClose}
        submitPressed={submitPressed}
        defaultEmail={defaultEmail}
        defaultName={defaultName}
        bookingRequest={request}
        paymentIntent={intent}
    />;
  };

  return renderModal();
};
