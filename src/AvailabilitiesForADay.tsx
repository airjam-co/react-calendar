import React from 'react';
import {
  BookingResource,
  CalendarBookingAvailability,
  CalendarBookingUnit,
  TimeRange,
  Translation,
  getTranslation,
} from '@airjam/types';
import { BookingRequestResource } from './BookingRequestResource';
import { Button } from 'react-bootstrap';
import { msToHumanizedDuration } from './utilities';

interface Props {
  timezone: string;
  availability: CalendarBookingAvailability;
  locale: string;
  translation: Translation;
  startTimeUtc: Date;
  onPress?: (dialogResource: BookingRequestResource) => void;
}

export const AvailabilitiesForADay = ({ availability, startTimeUtc, timezone, locale, translation, onPress }: Props) => {
  const [startTime, setStartTime] = React.useState<TimeRange | undefined>(undefined)

  React.useEffect(() => {});

  const renderAvailableTimes = () => {
    if (!availability || !availability.resources) return <div className='availabilities'><span className='empty'>The requested time frame has no available slots.</span></div>;
    return <div className='availabilities'>
        <div className='availabilities-label'>{startTime ? getTranslation(translation, "select_end_time") : getTranslation(translation, "select_time_slot")}</div>
        {availability.resources.map(function (resource, idx) {
          return <div className='availability-resource-container' key={'availability-resource-container-' + idx}>
            <div className='availability-resource-name'>
              {resource.name}
            </div>
            {(resource.bookingUnit === CalendarBookingUnit.Flexible) && startTime ?
              <div className='availability-clear'>
                <Button className='clear-button' onClick={() => { setStartTime(undefined); }}>{getTranslation(translation, "select_time_back")}</Button>
              </div> : ""}
            {renderAvailableSlotsForADay(resource)}
          </div>
        })}
    </div>
  }

  const renderAvailableSlotsForADay = (resource: BookingResource) => {
    const startTimeToCompareWith = startTimeUtc ? startTimeUtc : new Date();
    const anyLocale = "en-US";
    const localStartYear = Number(startTimeToCompareWith.toLocaleString(anyLocale, {year: 'numeric', timeZone: timezone}));
    const localStartMonth = Number(startTimeToCompareWith.toLocaleString(anyLocale, {month: 'numeric', timeZone: timezone}))
    const localStartDay = Number(startTimeToCompareWith.toLocaleString(anyLocale, {day: 'numeric', timeZone: timezone}))

    const relevantTimes: TimeRange[] = !resource || !resource.availableTimes ? [] :
      resource.availableTimes.filter((et) => {
        // true if it's the same locale date as the startTime
        if (!et || !et.startTimeUtc) {
          return false;
        }
        const sTime = new Date(et.startTimeUtc);
        const isRelevant = Number(sTime.toLocaleString(anyLocale, {year: 'numeric', timeZone: timezone})) === localStartYear &&
          Number(sTime.toLocaleString(anyLocale, {month: 'numeric', timeZone: timezone})) === localStartMonth &&
          Number(sTime.toLocaleString(anyLocale, {day: 'numeric', timeZone: timezone})) === localStartDay;
        return isRelevant;
      });
    let timeSlotsToShow: TimeRange[] = [];

    if (resource.bookingUnit === CalendarBookingUnit.Flexible && startTime) {
      let currentEndTime: Date | undefined = undefined;
      for (let i = 0; i < relevantTimes.length; i++) {
        const currentSlot = relevantTimes[i];
        if (currentSlot.startTimeUtc < startTime.startTimeUtc) {
          continue;
        }
        const diffInMs = (new Date(currentSlot.endTimeUtc)).getTime() - (new Date(startTime.startTimeUtc)).getTime();
        const diffInMinutes = diffInMs / 1000 / 60;
        if (resource.minimumBookingDurationInMin && (diffInMinutes < resource.minimumBookingDurationInMin)) continue;
        if (resource.maximumBookingDurationInMin && (diffInMinutes > resource.maximumBookingDurationInMin)) continue;
        if (diffInMinutes % resource.bookingIncrementsInMin) continue;

        if ((currentEndTime) && currentSlot.startTimeUtc > currentEndTime) {
          // This code is used to only show contiguous blocks of booking times.
          break;
        }
        timeSlotsToShow.push(currentSlot);
        currentEndTime = currentSlot.endTimeUtc;
      }
    } else {
      timeSlotsToShow = relevantTimes;
    }

    if (!timeSlotsToShow.length)
      return <div className='availability-resource' key={'available-slots-' + resource._id}>
        <span className='empty'>There are no availabilities for this resource</span>
      </div>
    return <div className='availability-resource' key={'available-slots-' + resource._id}>
      {timeSlotsToShow.map(function (timeSlot, idx) {
        if (startTime) return renderEndTimeSlot(resource, timeSlot, idx + '');
        return renderTimeSlot(resource, timeSlot, idx + '');
      })}
    </div>
  }

  const renderTimeSlot = (resource: BookingResource, slot: TimeRange, key: string) => {
    if (!slot.startTimeUtc || !slot.endTimeUtc) return <div key={key}></div>

    const startTimeUtc = new Date(slot.startTimeUtc)
    const dialogResource = {
        resource: resource,
        startTimeUtc: startTimeUtc,
        endTimeUtc: slot.endTimeUtc
      } as BookingRequestResource
    return <div key={key} className='availability-slot'>
      <Button className='reserve-slot-button' onClick={() => {
        if (resource.bookingUnit === CalendarBookingUnit.Flexible) {
          setStartTime(slot);
        } else {
          if (onPress) onPress(dialogResource)
        }
      }}>{showTime(startTimeUtc)}</Button>
    </div>
  }

  const renderEndTimeSlot = (resource: BookingResource, slot: TimeRange, key: string) => {
    if (!startTime || !slot.startTimeUtc || !slot.endTimeUtc) return <div key={key}></div>
    const endTimeUtc = new Date(slot.endTimeUtc)
    const dialogResource = {
        resource: resource,
        startTimeUtc: startTime.startTimeUtc,
        endTimeUtc: endTimeUtc
    } as BookingRequestResource

    return <div key={key} className='availability-slot'>
      <Button className='reserve-slot-button' onClick={() => {
        if (onPress) onPress(dialogResource)
      }}>{showTime(new Date(slot.endTimeUtc))} - {"(" + msToHumanizedDuration((new Date(slot.endTimeUtc).getTime() -  new Date(startTime.startTimeUtc).getTime()), locale) + ")"}</Button>
    </div>
  }

  const showTime = (timeToShow: Date) => {
    return timeToShow.toLocaleString(locale, { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: timezone })
  }

  return renderAvailableTimes();
};
