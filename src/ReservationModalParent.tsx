import React from 'react';
import type { BookingRequestResource } from './BookingRequestResource';
import { Col, Row } from 'react-bootstrap';
import { CalendarBookingRequest, EventReservationPaymentIntentDetail, PaymentProcessor, Translation, getTranslation } from '@airjam/types';
import { StripeElementLocale, loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import { ReservationModal } from './ReservationModal';

interface Props {
  bookingRequest: CalendarBookingRequest;
  locale?: string;
  translation: Translation;
  paymentIntent: EventReservationPaymentIntentDetail;
  timezone: string;
  resource: BookingRequestResource;
  paymentProcessorPublicKey?: string; // This must be provided statically during initial load.
  onClose?: () => void;
  defaultName?: string;
  defaultEmail?: string;
  submitPressed?: (
    resource: BookingRequestResource,
    bookingRequest: CalendarBookingRequest,
  ) => void;
}

export const ReservationModalParent = ({
  paymentIntent,
  bookingRequest,
  locale,
  translation,
  timezone,
  resource,
  paymentProcessorPublicKey,
  defaultEmail,
  defaultName,
  onClose,
  submitPressed,
}: Props) => {
  const stripePromise = paymentIntent.paymentProcessor === PaymentProcessor.Stripe ? loadStripe(paymentProcessorPublicKey ? paymentProcessorPublicKey : "") : undefined;
  const stripeOptions = {
    clientSecret: paymentIntent.paymentHandshake,
    locale: (locale ? locale : 'en-US') as StripeElementLocale,
  };

  const reservationModalParent = (): React.JSX.Element => {
    if (paymentIntent.paymentProcessor === PaymentProcessor.Stripe && stripePromise) {
      console.log(paymentIntent);
      console.log(paymentIntent.paymentHandshake);
      console.log(JSON.stringify(paymentIntent));
      const additionalContent = <Row>
        <Col sm={12}><h3>{getTranslation(translation, "booking_modal_payment_header")}</h3></Col>
        <Col sm={12}>
            <PaymentElement />
        </Col>
      </Row>;

      return <Elements stripe={stripePromise} options={stripeOptions}>
        <ReservationModal
          bookingRequest={bookingRequest}
          paymentIntent={paymentIntent}
          locale={locale}
          translation={translation}
          timezone={timezone}
          resource={resource}
          onClose={onClose}
          defaultEmail={defaultEmail}
          defaultName={defaultName}
          submitPressed={submitPressed}
          additionalFormElement={additionalContent} />
      </Elements>;
    }

    return <ReservationModal
      bookingRequest={bookingRequest}
      paymentIntent={paymentIntent}
      locale={locale}
      translation={translation}
      timezone={timezone}
      resource={resource}
      defaultEmail={defaultEmail}
      defaultName={defaultName}
      onClose={onClose}
      submitPressed={submitPressed} />
  };

  return reservationModalParent();
};
