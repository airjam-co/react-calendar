import React, { useEffect } from 'react';
import type { BookingRequestResource } from './BookingRequestResource';
import { Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import { BookingRequestInternal } from './BookingRequestInternal';
import * as Icon from 'react-bootstrap-icons';

interface Props {
  componentId: string;
  timezone: string;
  resource: BookingRequestResource;
  onClose?: () => void;
  submitPressed?: (
    resource: BookingRequestResource,
    bookingRequest: BookingRequestInternal,
  ) => void;
}

export const ReservationModal = ({
  componentId,
  timezone,
  resource,
  onClose,
  submitPressed,
}: Props) => {
  useEffect(() => {
    // TODO check this logic
  }, []);

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

  const reserveDialog = (): React.JSX.Element => {
    if (!resource || !resource.startTimeUtc || !resource.endTimeUtc || !resource.resource) return <div className='dialog-content'></div>
    const startTime = new Date(resource.startTimeUtc)
    const endTime = new Date(resource.endTimeUtc)
    type BookingRequestInternalKey = keyof BookingRequestInternal;
    if (!startTime || !endTime) return <div className='dialog-content'></div>
    return <Modal show={true} className='book-resource-popup-content' onHide={() => { closeModal() }}>
      <Modal.Header>
        <Modal.Title>
          {resource.resource.name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={(e) => {
          const form = e.currentTarget
          const bookingRequest = {} as BookingRequestInternal
          bookingRequest.id = componentId
          bookingRequest.resourceId = resource.resource._id
          bookingRequest.startTimeUtc = startTime.toISOString()
          bookingRequest.endTimeUtc = endTime.toISOString()
          for (let i = 0; i < form.elements.length; i++) {
            const elem = form.elements.item(i)
            if (!elem || !isFormFieldElement(elem) || !elem.id) continue
            const field = elem as HTMLInputElement | HTMLSelectElement | HTMLButtonElement
            if (field.id.toLowerCase() === "name") {
              bookingRequest.name = field.value
            } else if (field.id.toLowerCase() === "email") {
              bookingRequest.email = field.value
            } else if (field.id.toLowerCase() === "notes") {
              bookingRequest.comment = field.value
            } else {
              bookingRequest[field.id as BookingRequestInternalKey] = field.value
            }
          }
          if (submitPressed) {
            submitPressed(resource, bookingRequest);
          }
          e.preventDefault()
        }}>

        <Row className='dialog-upper-content'>
            <Col sm={12}>
              <div className='booking-timeframe'>
                <Icon.CalendarEvent />
                &nbsp;{startTime.toLocaleString('en-us', {
                  timeZone:timezone.toString(), weekday:"short", year:"numeric", month:"short", day:"numeric", hour: 'numeric', minute: 'numeric', hour12: true
                }) } to {endTime.toLocaleString('en-us', {
                  timeZone:timezone.toString(), weekday:"short", month:"short", day:"numeric", hour: 'numeric', minute: 'numeric', hour12: true
                })}
              </div>
              <div className='booking-duration'>
                <Icon.Clock />
                &nbsp;{resource.resource.bookingDurationInMin} min
              </div>
              <div className='booking-timezone'>
                <Icon.GlobeAmericas />
                &nbsp;{timezone}
              </div>
            </Col>
        </Row>

        <Form.Group as={Row} className="mb-3" controlId="details">
          <Col sm={12}>
            <h6>Enter details to book</h6>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="name">
          <Form.Label column sm={2}>
            Name<sup>*</sup>
          </Form.Label>
          <Col sm={10}>
            <InputGroup hasValidation>
              <Form.Control type="text" placeholder="Name" required />
              <Form.Control.Feedback type="invalid">
                Please enter a name.
              </Form.Control.Feedback>
            </InputGroup>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="email">
          <Form.Label column sm={2}>
            Email<sup>*</sup>
          </Form.Label>
          <Col sm={10}>
            <Form.Control type="email" placeholder="Email" required />
            <Form.Control.Feedback type="invalid">
              Please enter a valid email address.
            </Form.Control.Feedback>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="notes">
          <Form.Label column sm={2}>
            Notes
          </Form.Label>
          <Col sm={10}>
            <Form.Control type="textarea" placeholder="" />
          </Col>
        </Form.Group>


        <Form.Group as={Row} className="mb-3">
          <Col sm={{ span: 10, offset: 2 }}>
            <Button type="submit">Book</Button>
          </Col>
        </Form.Group>
      </Form>
      </Modal.Body>
    </Modal>
  };

  return reserveDialog();
};
