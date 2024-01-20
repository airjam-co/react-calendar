import React from 'react';
import {
  BookingResource,
  CalendarBookingAvailability,
  TimeRange,
} from '@airjam/types';
import { BookingRequestResource } from './BookingRequestResource';
import { Button } from 'react-bootstrap';

interface Props {
  timezone: string;
  availability: CalendarBookingAvailability;
  onPress?: (dialogResource: BookingRequestResource) => void;
}

export const AvailabilitiesForADay = ({ availability, timezone, onPress }: Props) => {
  React.useEffect(() => {});

  const renderAvailableTimes = () => {
    if (!availability || !availability.resources) return
      <div className='availabilities'>
        <span className='empty'>There are no availabilities for the given time frame</span>
      </div>;
    return <div className='availabilities'>
        {availability.resources.map(function (resource, idx) {
          return <div className='availability-resource-container' key={'availability-resource-container-' + idx}>
            <div className='availability-resource-name'>
              {resource.name}
            </div>
            {renderAvailableSlots(resource)}
          </div>
        })}
    </div>
  }

  const renderAvailableSlots = (resource: BookingResource) => {
    if (!resource || !resource.availableTimes || !resource.availableTimes.length)
      return <div className='availability-resource' key={'available-slots-' + resource._id}>
        <span className='empty'>There are no availabilities for this resource</span>
      </div>
    return <div className='availability-resource' key={'available-slots-' + resource._id}>
      {resource.availableTimes.map(function (timeSlot, idx) {
        return renderSlot(resource, timeSlot, idx + '')
      })}
    </div>
  }

  const renderSlot = (resource: BookingResource, slot: TimeRange, key: string) => {
    if (!slot.startTimeUtc || !slot.endTimeUtc) return <div key={key}></div>
    const startTimeUtc = new Date(slot.startTimeUtc)
    const dialogResource = {
        resource: resource,
        startTimeUtc: startTimeUtc,
        endTimeUtc: slot.endTimeUtc
      } as BookingRequestResource
    return <div key={key} className='availability-slot'>
      <Button className='reserve-slot-button' onClick={() => { if (onPress) onPress(dialogResource) }}>{showTime(startTimeUtc)}</Button>
    </div>
  }

  const showTime = (timeToShow: Date) => {
    return timeToShow.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: timezone })
  }

  return renderAvailableTimes();
};
