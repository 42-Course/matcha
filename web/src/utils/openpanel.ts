import { OpenPanel, type IdentifyPayload, type TrackProperties } from '@openpanel/web';

const clientId = import.meta.env.VITE_OPENPANEL_CLIENT_ID;

/**
 * Null when VITE_OPENPANEL_CLIENT_ID is unset, so local dev doesn't ship
 * events anywhere. Every helper below no-ops in that case.
 *
 * trackScreenViews patches the history API, which already covers react-router
 * navigations — no per-route wiring needed.
 */
export const op = clientId
  ? new OpenPanel({
      clientId,
      apiUrl: import.meta.env.VITE_OPENPANEL_API_URL || undefined,
      trackScreenViews: true,
      trackOutgoingLinks: true,
      trackAttributes: true,
    })
  : null;

export const track = (name: string, properties?: TrackProperties) => op?.track(name, properties);

export const identify = (payload: IdentifyPayload) => op?.identify(payload);

/** Call on logout so the next user isn't attributed to the previous profile. */
export const clearIdentity = () => op?.clear();
