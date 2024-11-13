import React, { useEffect } from 'react';
import type { BookingResultPage } from './BookingResultPage';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import * as Icon from 'react-bootstrap-icons';
import { msToHumanizedDuration } from './utilities';
import { EventReservationStatus, Translation, getTranslation } from '@airjam/types';

interface Props {
  timezone: string;
  locale?: string;
  translation: Translation;
  bookingResult: BookingResultPage;
  onClose?: () => void;
}

export const ReservationSuccessModal = ({
  bookingResult,
  locale,
  translation,
  timezone,
  onClose,
}: Props) => {

  useEffect(() => {
    // TODO check this logic
  }, []);

  const reserveSuccessDialog = () => {
    return <Modal show={true} className='booking-result' onHide={() => {
      console.log("on hide is triggered somehow");
      if (onClose) onClose();
    }} animation={false}>
      <Modal.Header>
        <Modal.Title>
          {bookingResult && bookingResult.response && bookingResult.response.status === EventReservationStatus.Requested ? getTranslation(translation, "booking_pending_modal_title") : getTranslation(translation, "booking_success_modal_title")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {getTranslation(translation, "booking_success_modal_message")}{bookingResult.resource.resource.name}
        <div className='booking-timeframe'>
          <Icon.CalendarEvent />
          &nbsp;{new Date(bookingResult.request.startTimeUtc).toLocaleString(locale, {
            timeZone:timezone.toString(), weekday:"short", year:"numeric", month:"short", day:"numeric", hour: 'numeric', minute: 'numeric', hour12: true
          })} {getTranslation(translation, "freeform_operating_hours_hour_duration_phrase")} {new Date(bookingResult.request.endTimeUtc).toLocaleString(locale, {
            timeZone:timezone.toString(), weekday:"short", month:"short", day:"numeric", hour: 'numeric', minute: 'numeric', hour12: true
          })}
        </div>
        <div className='booking-duration'>
          <Icon.Clock />
          &nbsp;{bookingResult ? msToHumanizedDuration(new Date(bookingResult.request.endTimeUtc).getTime() - new Date(bookingResult.request.startTimeUtc).getTime(), locale) : ""}
        </div>
        <div className='booking-timezone'>
          <Icon.GlobeAmericas />
          &nbsp;{timezone}
        </div>
        <div className='booking-id'>
          <Icon.Key />
          &nbsp;{getTranslation(translation, "reservation_id_label")}{bookingResult.response.id}
        </div>
        <div className='booking-total'>
          <Icon.CashCoin />
          &nbsp;{getTranslation(translation, "cost_total")}: {bookingResult.response.paymentIntent.currency} {bookingResult.response.paymentIntent.total}
        </div>
        <br />
        {getTranslation(translation, "booking_success_modal_email_sent")}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => {
          if (onClose) onClose();
        }}>
          {getTranslation(translation, "close_modal")}
        </Button>
      </Modal.Footer>
    </Modal>
  }

  return reserveSuccessDialog();
};
