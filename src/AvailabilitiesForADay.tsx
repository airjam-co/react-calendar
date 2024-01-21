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
  startTimeUtc: Date;
  onPress?: (dialogResource: BookingRequestResource) => void;
}

export const AvailabilitiesForADay = ({ availability, startTimeUtc, timezone, onPress }: Props) => {
  React.useEffect(() => {});

  const renderAvailableTimes = () => {
    if (!availability || !availability.resources) return <div className='availabilities'><span className='empty'>There are no availabilities for the given time frame</span></div>;
    return <div className='availabilities'>
        {availability.resources.map(function (resource, idx) {
          return <div className='availability-resource-container' key={'availability-resource-container-' + idx}>
            <div className='availability-resource-name'>
              {resource.name}
            </div>
            {renderAvailableSlotsForADay(resource)}
          </div>
        })}
    </div>
  }

  const renderAvailableSlotsForADay = (resource: BookingResource) => {
    // filter available times to current day only
    const relevantTimes: TimeRange[] = resource.availableTimes.filter((et) => {
      // true if it's the same locale date as the startTime
      if (!et || !et.startTimeUtc) {
        return false;
      }
      const sTime = new Date(et.startTimeUtc);
      return (
        sTime.getFullYear() === startTimeUtc.getUTCFullYear() &&
        sTime.getMonth() === startTimeUtc.getMonth() &&
        sTime.getDay() === startTimeUtc.getDay()
      );
    });

    if (!relevantTimes.length)
      return <div className='availability-resource' key={'available-slots-' + resource._id}>
        <span className='empty'>There are no availabilities for this resource</span>
      </div>
    return <div className='availability-resource' key={'available-slots-' + resource._id}>
      {relevantTimes.map(function (timeSlot, idx) {
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
