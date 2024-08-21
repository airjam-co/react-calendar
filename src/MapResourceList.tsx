import React from 'react';
import { AirJamQuery, CalendarResource, DEFAULT_DESCRIPTION_LENGTH_CUTOFF, PaginationStyle, Point, Translation, getTranslation } from '@airjam/types';
import { GoogleMap, InfoWindowF, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import ReactDOM from 'react-dom';

interface Props {
  resources: CalendarResource[];
  locale?: string;
  translation: Translation;
  googleMapsApiKey?: string;
  descriptionLength?: number;
  currentPage?: number;
  paginationStyle?: PaginationStyle;
  defaultCenter?: Point;
  defaultZoom?: number;
  latitude?: number;
  longitude?: number;
  filters?: AirJamQuery;
  markerImageUrl?: string;
  markerImageMouseOverUrl?: string;
  markerImageWidth?: number;
  markerImageHeight?: number;
  redoSearchFunc?: () => void;
  renderResourceFunc?: (resource: CalendarResource, index: number) => React.JSX.Element;
  onPagePressed?: (newPage: number) => void;
  onMapBoundsChanged?: (northEast?: Point, southWest?: Point) => void;
  markerLabelFunc?: (resource: CalendarResource, index: number) => string | google.maps.MarkerLabel | undefined;
  renderMarkerInfoWindowFunc?: (resource: CalendarResource) => React.JSX.Element;
}

interface GoogleMarker {
  id: any,
  name: string,
  position: {
    lat: number,
    lng: number
  },
  resource?: CalendarResource
}

const DEFAULT_ZOOM: number = 7;
const DEFAULT_MARKER_IMG = "https://s3.amazonaws.com/musictraveler.herokuapp.com/static/images/map-marker-blue-white.svg";
const DEFAULT_MARKER_IMG_MOUSEOVER = "https://s3.amazonaws.com/musictraveler.herokuapp.com/static/images/map-marker-blue.svg";
const DEFAULT_NO_MEDIA_IMAGE_URL = "https://artscimedia.case.edu/wp-content/uploads/sites/79/2016/12/14205134/no-user-image.gif";
const DEFAULT_MARKER_WIDTH = 56;
const DEFAULT_MARKER_HEIGHT = 56;
const DEFAULT_GOOGLE_MAPS_API_KEY = "AIzaSyA8xMW1giwvraqrUpM7bLQeURGjr5VUrBw";

const pointToGoogleCoordinate = (point: Point) => {
  // Point struct is assumed to be in lng, lat order
  if (point && point.coordinates && point.coordinates.length > 1) {
    return {
      lat: point.coordinates[1],
      lng: point.coordinates[0]
    }
  }
  return { lat: 0, lng: 0 }
};

//Returns true if it is a DOM node
function isDOMNode(o: any){
  return (
    typeof Node === "object" ? o instanceof Node :
    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
  );
}

//Returns true if it is a DOM element
function isDOMElement(o: any){
  return (
    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
);
}
class DOMJSXWrapperProps {
  child: any;
}

class DOMJSXWrapper extends React.Component<DOMJSXWrapperProps> {
  render() {
    return <div ref={ ref => {
      if (ref) {
        if (ref.hasChildNodes() && ref.firstChild) {
          ref.removeChild(ref.firstChild);
        }
        ref.appendChild(this.props.child)
      }
    } }></div>;
  }
}

const toJSXIfDOM = (elem: any) => {
  if (!elem) return undefined;
  if (isDOMElement(elem) || isDOMNode(elem)) {
    return <DOMJSXWrapper child={ elem }/>;
  }
  return elem;
}

export const MapResourceList = ({
  resources,
  locale,
  translation,
  descriptionLength,
  defaultCenter,
  defaultZoom,
  latitude,
  longitude,
  markerImageUrl,
  markerImageMouseOverUrl,
  markerImageWidth,
  markerImageHeight,
  googleMapsApiKey,
  markerLabelFunc,
  redoSearchFunc,
  renderMarkerInfoWindowFunc,
  renderResourceFunc,
  onMapBoundsChanged,
}: Props) => {
  const [isMounted, setIsMounted] = React.useState<Boolean>(false)
  const [map, setMap] = React.useState<google.maps.Map | undefined>(undefined)
  const [mapControlElem, setMapControlElem] = React.useState<HTMLElement | undefined>(undefined)
  const [activeMarker, setActiveMarker] = React.useState(null);
  const [mouseOverMarker, setMouseOverMarker] = React.useState(null);
  const [dummyValue, forceUpdate] = React.useState(1);
  const mapCenter = React.useRef<{lat: number, lng: number}>({lat: -122.3900895, lng: -37.7715826});
  const northEastPoint = React.useRef<Point | undefined>(undefined);
  const southWestPoint = React.useRef<Point | undefined>(undefined);
  const markers = React.useRef<{ [id: string]: GoogleMarker }>({});

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey ? googleMapsApiKey : DEFAULT_GOOGLE_MAPS_API_KEY,
  })

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    setMap(map)
  }, [])

  const onUnmount = React.useCallback(function callback(map: any) {
    setMap(undefined)
  }, [])

  React.useEffect(() => {
    if (!isMounted) {
      setIsMounted(true)

      if (defaultCenter && defaultCenter.coordinates.length > 1) {
        mapCenter.current = {lat: defaultCenter.coordinates[1], lng: defaultCenter.coordinates[0]};
      } else if (latitude && longitude) {
        mapCenter.current = {lat: latitude, lng: longitude};
      }
    }
    resetMarkers();
  }, [])

  React.useEffect(() => {
    resetMarkers();
  }, [resources])

  React.useEffect(() => {
    if (defaultCenter && defaultCenter.coordinates.length > 1) {
      mapCenter.current = {lat: defaultCenter.coordinates[1], lng: defaultCenter.coordinates[0]};
    } else if (latitude && longitude) {
      mapCenter.current = {lat: latitude, lng: longitude};
    }
    northEastPoint.current = undefined;
    southWestPoint.current = undefined;
    if (onMapBoundsChanged) onMapBoundsChanged(undefined, undefined);
    forceUpdate(dummyValue + 1);
  }, [defaultCenter, latitude, longitude])

  const resetMarkers = () => {
    markers.current = {};
    resources.forEach(resource => {
      if (resource.approximateLocation && resource.approximateLocation.coordinates.length > 1) {
        markers.current[resource._id] = {
          id: resource._id,
          name: resource.name,
          position: pointToGoogleCoordinate(resource.approximateLocation),
          resource: resource
        };
      }
    });
    forceUpdate(dummyValue + 1);
  };

  const handleActiveMarker = (marker: any) => {
    if (marker === activeMarker) {
      return;
    }
    setActiveMarker(marker);
  };

  const handleBoundsChanged = () => {
    if (map) {
      let bounds = map.getBounds()
      const newCenter = map.getCenter()
      if (newCenter && newCenter.lat() && newCenter.lng()) {
        mapCenter.current = {lat: newCenter.lat(), lng: newCenter.lng()};
      }

      if (bounds){
        const northEast: Point = {
          type: 'Point',
          coordinates: [bounds.getNorthEast().lng(), bounds.getNorthEast().lat()],
        } as Point
        const southWest: Point = {
          type: 'Point',
          coordinates: [bounds.getSouthWest().lng(), bounds.getSouthWest().lat()],
        } as Point

        if (northEastPoint.current && southWestPoint.current) {
          const neDiff = calcDistanceInMeters(northEastPoint.current.coordinates[1], northEastPoint.current.coordinates[0], northEast.coordinates[1], northEast.coordinates[0]);
          const swDiff = calcDistanceInMeters(southWestPoint.current.coordinates[1], southWestPoint.current.coordinates[0], southWest.coordinates[1], southWest.coordinates[0]);
          if (neDiff + swDiff < 100) return; // if changes are less than 100 meters, ignore
        }
        northEastPoint.current = northEast;
        southWestPoint.current = southWest;

        if (!mapControlElem) {
          const elem = document.getElementById("resource-list-google-map-control-container") as HTMLElement
          if (elem) setMapControlElem(elem);
        } else {
          if (onMapBoundsChanged) {
            ReactDOM.render(
                <button className='map-control-btn' onClick={() => refreshSearchPressed()} >{getTranslation(translation, "redo_search_in_map")}</button>,
              mapControlElem
            );
            map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
            map.controls[google.maps.ControlPosition.TOP_CENTER].push(mapControlElem);
            onMapBoundsChanged(northEast, southWest)
          }
        }
      }
    }
  };

  const refreshSearchPressed = () => {
    if (redoSearchFunc) redoSearchFunc();
    if (mapControlElem && map) {
      // hide the button
      map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
    }
  };

  const renderResourceList = () => {
    // TODO add pagination or infinite scroll
    return <div className='resource-list col-12 col-sm-7 row'>
      {resources.map((r, idx) => {
        if (renderResourceFunc) return toJSXIfDOM(renderResourceFunc(r, idx))
        let description = r.description ? r.description : ''
        const descLimit = descriptionLength || DEFAULT_DESCRIPTION_LENGTH_CUTOFF
        if (descLimit > 2 && description.length > descLimit)
          description = description.substring(0, descLimit - 3) + '...'
        return <div key={'e-' + idx} className='resource-block col-xs-12 col-md-6' onClick={() => {
          handleActiveMarker(r._id)
        }}>
          <div className='resource-block-container'>
            <span className='resource-media'>
              <img src={r && r.media && r.media.length > 0 ? r.media[0].uri : DEFAULT_NO_MEDIA_IMAGE_URL}></img>
            </span>
            <span className='description-block'>
              <span className='title'>{r.name}</span>
              <span className='description'>{description}</span>
            </span>
          </div>
        </div>
      // why doesn't this work when it's componentized?
      // return <ResourceDetail key={idx} resource={r} descriptionLength={descriptionLength} onPress={(id) => {
      //   console.log('pressed: ' + id)
      // }} />
      })}
    </div>;
  }

  const renderResourceInfoWindow = (r: CalendarResource) => {
    if (renderMarkerInfoWindowFunc) return renderMarkerInfoWindowFunc(r);
    return <div className='resource-info-window-container'>
      <span className='resource-media'>
        <img src={r && r.media && r.media.length > 0 ? r.media[0].uri : DEFAULT_NO_MEDIA_IMAGE_URL}></img>
      </span>
      <span className='description-block'>
        <span className='title'>{r.name}</span>
      </span>
    </div>
  }

  const markerSize = () => {
    const width = markerImageWidth ? markerImageWidth : DEFAULT_MARKER_WIDTH;
    const height = markerImageHeight ? markerImageHeight : DEFAULT_MARKER_HEIGHT;
    return new window.google.maps.Size(width, height);
  }

  const markerLabel = (r: CalendarResource, idx: number) => {
    if (markerLabelFunc) return markerLabelFunc(r, idx);
    const label = r.staticPriceCurrency + r.staticPrice;
    return label;
  }

  const calcDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    var R = 6371; // km
    var dLat = toRad(lat2-lat1);
    var dLon = toRad(lon2-lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000;
  }

  const toRad = (value: number) => {
      return value * Math.PI / 180;
  }

  const renderMapResourceList = () => {
    return isLoaded ? (
      <div className='resource-list-container row'>
        {renderResourceList()}
        <div className='resource-map col-5 d-none d-sm-block'>
          <GoogleMap
            mapContainerClassName='resource-map-box'
            zoom={defaultZoom ? defaultZoom : DEFAULT_ZOOM}
            center={mapCenter.current}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={() => setActiveMarker(null)}
            onBoundsChanged={() => handleBoundsChanged()}
            options={{
              mapTypeControl: false
            }}
          >
          {Object.keys(markers.current).map((key, idx) => {
            const markerResource = markers.current[key]
            return <MarkerF
              key={markerResource.id}
              position={markerResource.position}
              onClick={() => handleActiveMarker(markerResource.id)}
              onMouseOver={() => setMouseOverMarker(markerResource.id)}
              onMouseOut={() => setMouseOverMarker(null)}
              label={markerResource.resource ? markerLabel(markerResource.resource, idx) : undefined}
              options={{
                icon: mouseOverMarker && (mouseOverMarker === markerResource.id) ? {
                  scaledSize: markerSize(),
                  url: markerImageMouseOverUrl ? markerImageMouseOverUrl : DEFAULT_MARKER_IMG_MOUSEOVER,
                } : {
                  scaledSize: markerSize(),
                  url: markerImageUrl ? markerImageUrl : DEFAULT_MARKER_IMG,
                },
              }}
            >
              {activeMarker === markerResource.id ? (
                <InfoWindowF onCloseClick={() => setActiveMarker(null)}>
                  {markerResource.resource ? renderResourceInfoWindow(markerResource.resource) : null}
                </InfoWindowF>
              ) : null}
            </MarkerF>
        })
        }
        </GoogleMap>
        </div>
        <span id='resource-list-google-map-control-container'></span>
      </div>
    ): <div>loading...</div>
  }

  return renderMapResourceList();
};
