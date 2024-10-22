import React, { useEffect } from 'react';
import type { BookingRequestResource } from './BookingRequestResource';
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import * as Icon from 'react-bootstrap-icons';
import { BookingResource, CalendarBookingRequest, CalendarReservationPriceUnit, EventReservationPaymentIntentDetail, PaymentProcessor, Translation, getTranslation } from '@airjam/types';
import { minToHumanizedDuration, msToHumanizedDuration } from './utilities';
import { useElements, useStripe } from '@stripe/react-stripe-js';
interface Props {
  bookingRequest: CalendarBookingRequest;
  paymentIntent: EventReservationPaymentIntentDetail;
  locale?: string;
  translation: Translation;
  timezone: string;
  resource: BookingRequestResource;
  onClose?: () => void;
  defaultName?: string;
  defaultEmail?: string;
  submitPressed?: (
    resource: BookingRequestResource,
    bookingRequest: CalendarBookingRequest,
  ) => void;
  additionalFormElement?: React.JSX.Element;
}

export const ReservationModal = ({
  paymentIntent,
  bookingRequest,
  timezone,
  resource,
  locale,
  translation,
  additionalFormElement,
  defaultEmail,
  defaultName,
  onClose,
  submitPressed,
}: Props) => {
  const stripeInstance = (paymentIntent.paymentProcessor === PaymentProcessor.Stripe) && (paymentIntent.total > 0) ? useStripe() : null;
  const stripeElements = (paymentIntent.paymentProcessor === PaymentProcessor.Stripe) && (paymentIntent.total > 0) ? useElements() : null;

  const [isMounted, setIsMounted] = React.useState<Boolean>(false)
  const [startTime, setStartTime] = React.useState<Date>(new Date());
  const [endTime, setEndTime] = React.useState<Date>(new Date());
  const localeToUse = React.useRef(locale ? locale : "en-US");

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      let requestStartTime = new Date();
      let requestEndTime = new Date();
      if (resource && resource.startTimeUtc) requestStartTime = new Date(resource.startTimeUtc);
      if (resource && resource.endTimeUtc) requestEndTime = new Date(resource.endTimeUtc);

      setStartTime(requestStartTime);
      setEndTime(requestEndTime);
    }
  }, []);

  useEffect(() => {
    if (locale) localeToUse.current = locale;
  }, [locale]);

  const closeModal = () => {
    if (onClose) {
      onClose();
    }
  };

  function isFormFieldElement(element: Element): boolean {
    if (!("value" in element)) {
        return false
    }
    return true
  }

  function showDynamicPricing(resource: BookingResource, curr?: string): React.JSX.Element {
    // resource.resource.staticPrice} per {resource.resource.staticPriceUnit
    if (resource.staticPriceUnit === CalendarReservationPriceUnit.WholeEvent) {
      <div></div>
    }
    const currency = curr ? curr : "USD";
    return <div className='payment-pricing'>
      <Icon.Ticket />&nbsp;
      { Intl.NumberFormat(localeToUse.current, {
        style: 'currency',
        currency: currency,
      }).format(resource.staticPrice)}
      &nbsp; {getTranslation(translation, "freeform_base_price_pricing_unit_selector")} {minToHumanizedDuration(resource.bookingIncrementsInMin, locale)}
    </div>;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    type CalendarBookingRequestKey = keyof CalendarBookingRequest;
    const form = e.currentTarget
    e.preventDefault();

    const request = bookingRequest; // TODO rename this.
    request.paymentIntentId = paymentIntent.paymentIntentId;
    request.locale = locale ? locale : "";
    request.timezone = timezone;

    for (let i = 0; i < form.elements.length; i++) {
      const elem = form.elements.item(i)
      if (!elem || !isFormFieldElement(elem) || !elem.id) continue
      const field = elem as HTMLInputElement | HTMLSelectElement | HTMLButtonElement
      if (field.id.toLowerCase() === "name") {
        request.name = field.value
      } else if (field.id.toLowerCase() === "email") {
        request.email = field.value
      } else if (field.id.toLowerCase() === "notes") {
        request.comment = field.value
      } else {
        request[field.id as CalendarBookingRequestKey] = field.value
      }
    }
    if ((paymentIntent.total > 0) && paymentIntent.paymentProcessor === PaymentProcessor.Stripe && stripeInstance && stripeElements) {
      const preSubmit = await stripeElements.submit();
      if (preSubmit.error) {
        console.log(preSubmit.error);
        return;
      }
      const result = await stripeInstance.confirmPayment({
        //`Elements` instance that was used to create the Payment Element
        elements: stripeElements,
        clientSecret: paymentIntent.paymentHandshake,
        confirmParams: {
          return_url: "https://airjam.co/payments",
        },
        redirect: 'if_required'
      });
      if (result.error) {
        // Show error to your customer (for example, payment details incomplete)
        console.log(result.error.message);
        return;
      }
    }
    if (submitPressed) {
      // you need to pass booking reservation id, and payment intent
      submitPressed(resource, request);
    }
  };

  const reserveDialog = (): React.JSX.Element => {
    if (!startTime || !endTime) return <div className='dialog-content'></div>;
    return <Modal show={true} className='book-resource-popup-content' onHide={() => { closeModal() }}>
      <Modal.Header>
        <Modal.Title>
          {resource.resource.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>

        <Form.Group as={Row} className="mb-3" controlId="details">
          <Col sm={12}>
            <h3>{getTranslation(translation, "booking_modal_details_header")}</h3>
          </Col>
        </Form.Group>

        <Row className='dialog-upper-content'>
            <Col sm={12}>
              <div className='booking-timeframe'>
                <Icon.CalendarEvent />
                &nbsp;{startTime.toLocaleString(localeToUse.current, {
                  timeZone:timezone.toString(), weekday:"short", year:"numeric", month:"short", day:"numeric", hour: 'numeric', minute: 'numeric', hour12: true
                }) } {getTranslation(translation, "freeform_operating_hours_hour_duration_phrase")} {endTime.toLocaleString(localeToUse.current, {
                  timeZone:timezone.toString(), weekday:"short", month:"short", day:"numeric", hour: 'numeric', minute: 'numeric', hour12: true
                })}
              </div>
              <div className='payment-detail'>
                <Icon.Clock />
                &nbsp;{msToHumanizedDuration(endTime.getTime() - startTime.getTime(), locale)}
              </div>
              <div className='booking-timezone'>
                <Icon.GlobeAmericas />
                &nbsp;{timezone}
              </div>

              {showDynamicPricing(resource.resource, paymentIntent.currency)}

              <div className='payment-total'>
                {getTranslation(translation, "cost_total")}:&nbsp;
                { paymentIntent && paymentIntent.total > 0 ? Intl.NumberFormat(localeToUse.current,
                  {
                    style: 'currency',
                    currency: paymentIntent.currency ? paymentIntent.currency : "USD",
                  }).format(paymentIntent.total) : getTranslation(translation, "free")}
              </div>
            </Col>
        </Row>

        <Form.Group as={Row} className="mb-3" controlId="details">
          <Col sm={12}>
            <h3>{getTranslation(translation, "booking_modal_booker_information")}</h3>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="name">
          <Form.Label column sm={2}>
            {getTranslation(translation, "booking_modal_name_field")}<sup>*</sup>
          </Form.Label>
          <Col sm={10}>
            <InputGroup hasValidation>
              <Form.Control type="text" placeholder="Name" defaultValue={defaultName} required />
              <Form.Control.Feedback type="invalid">
                {getTranslation(translation, "booking_modal_name_field_required")}
              </Form.Control.Feedback>
            </InputGroup>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="email">
          <Form.Label column sm={2}>
            {getTranslation(translation, "booking_modal_email_field")}<sup>*</sup>
          </Form.Label>
          <Col sm={10}>
            <Form.Control type="email" placeholder="Email" defaultValue={defaultEmail} required />
            <Form.Control.Feedback type="invalid">
              {getTranslation(translation, "booking_modal_email_field_required")}
            </Form.Control.Feedback>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="notes">
          <Form.Label column sm={2}>
            {getTranslation(translation, "booking_modal_notes_field")}
          </Form.Label>
          <Col sm={10}>
            <Form.Control type="textarea" placeholder="" />
          </Col>
        </Form.Group>

        {additionalFormElement ? additionalFormElement : ""}

        <Form.Group as={Row} className="mb-3">
          <Col>
            <div className='submit-container'>
              <Button type="submit">{getTranslation(translation, "booking_modal_submit_button_label")}</Button>
            </div>
          </Col>
        </Form.Group>
      </Form>
      </Modal.Body>
    </Modal>
  };

  return reserveDialog();
};
