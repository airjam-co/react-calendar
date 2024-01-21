import React, { useEffect } from 'react';
import type { BookingResultPage } from './BookingResultPage';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import * as Icon from 'react-bootstrap-icons';

interface Props {
  timezone: string;
  bookingResult: BookingResultPage;
  onClose?: () => void;
}

export const ReservationSuccessModal = ({
  bookingResult,
  timezone,
  onClose,
}: Props) => {
  useEffect(() => {
    // TODO check this logic
  }, []);

  const reserveSuccessDialog = () => {
    return <Modal show={true} className='booking-result' onHide={() => { if (onClose) onClose(); }}>
      <Modal.Header>
        <Modal.Title>
          Booking confirmed
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        You've booked {bookingResult.resource.resource.name}
        <div className='booking-timeframe'>
          <Icon.CalendarEvent />
          &nbsp;{new Date(bookingResult.request.startTimeUtc).toLocaleString('en-us', {
            timeZone:timezone.toString(), weekday:"short", year:"numeric", month:"short", day:"numeric", hour: 'numeric', minute: 'numeric', hour12: true
          })} to {new Date(bookingResult.request.endTimeUtc).toLocaleString('en-us', {
            timeZone:timezone.toString(), weekday:"short", month:"short", day:"numeric", hour: 'numeric', minute: 'numeric', hour12: true
          })}
        </div>
        <div className='booking-duration'>
          <Icon.Clock />
          &nbsp;{bookingResult ? bookingResult.resource.resource.bookingDurationInMin : ""} min
        </div>
        <div className='booking-timezone'>
          <Icon.GlobeAmericas />
          &nbsp;{timezone}
        </div>
        <br />
        An invitation has been emailed to you.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={() => { if (onClose) onClose(); }}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  }

  return reserveSuccessDialog();
};
