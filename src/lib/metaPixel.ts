/**
 * Meta Pixel (Facebook Pixel) tracking utility
 * 
 * The Pixel itself (ID 1151906889213802) is installed in index.html
 */

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq: (
      action: string,
      event: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void;
  }
}

/**
 * Track a custom event with Meta Pixel
 * @param eventName - The name of the event (e.g., 'Purchase', 'AddToCart', 'InitiateCheckout')
 * @param params - Optional parameters for the event (e.g., { value: 100, currency: 'INR' })
 * @param eventID - Optional unique event ID (used by Meta to de-duplicate browser + server events)
 */
export const trackMetaEvent = (
  eventName: string,
  params?: Record<string, unknown>,
  eventID?: string
): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params, eventID ? { eventID } : undefined);
  } else {
    console.warn('Meta Pixel not loaded. Event not tracked:', eventName);
  }
};

/**
 * Track a ViewContent event (when user views a product/package)
 * @param value - The content value
 * @param currency - The currency code (default: 'INR')
 * @param contentName - The content name (e.g., package type)
 * @param contentType - The content type (default: 'product')
 */
export const trackViewContent = (
  value: number,
  currency: string = 'INR',
  contentName?: string,
  contentType: string = 'product'
): void => {
  const params: Record<string, unknown> = {
    value,
    currency,
    content_type: contentType,
  };

  if (contentName) {
    params.content_name = contentName;
  }

  trackMetaEvent('ViewContent', params);
};

/**
 * Track a Lead event (when user submits form details)
 * @param value - The lead value
 * @param currency - The currency code (default: 'INR')
 * @param contentName - Optional content name
 */
export const trackLead = (
  value?: number,
  currency: string = 'INR',
  contentName?: string
): void => {
  const params: Record<string, unknown> = {};

  if (value !== undefined) {
    params.value = value;
    params.currency = currency;
  }

  if (contentName) {
    params.content_name = contentName;
  }

  trackMetaEvent('Lead', params);
};

/**
 * Track an AddToCart event (for remarketing)
 * @param value - The cart value
 * @param currency - The currency code (default: 'INR')
 * @param contentName - Optional content name
 */
export const trackAddToCart = (
  value: number,
  currency: string = 'INR',
  contentName?: string
): void => {
  const params: Record<string, unknown> = {
    value,
    currency,
  };

  if (contentName) {
    params.content_name = contentName;
  }

  trackMetaEvent('AddToCart', params);
};

/**
 * Track a purchase event
 * @param value - The purchase value
 * @param currency - The currency code (default: 'INR')
 * @param orderId - Optional order ID (also used as the eventID: purchase_<orderId>)
 * @param packageType - Optional package type
 */
export const trackPurchase = (
  value: number,
  currency: string = 'INR',
  orderId?: string,
  packageType?: string
): void => {
  const params: Record<string, unknown> = {
    value,
    currency,
    content_type: 'product',
  };

  if (orderId) {
    params.content_ids = [orderId];
    params.content_name = packageType || 'Numerology Report';
  }

  // eventID must match the server-side (CAPI) event_id so Meta counts it only once
  trackMetaEvent('Purchase', params, orderId ? `purchase_${orderId}` : undefined);
};

/**
 * Track an initiate checkout event
 * @param value - The checkout value
 * @param currency - The currency code (default: 'INR')
 * @param packageType - Optional package type
 */
export const trackInitiateCheckout = (
  value: number,
  currency: string = 'INR',
  packageType?: string
): void => {
  const params: Record<string, unknown> = {
    value,
    currency,
  };

  if (packageType) {
    params.content_name = packageType;
  }

  trackMetaEvent('InitiateCheckout', params);
};

/**
 * Track a page view (usually handled automatically, but can be used for SPA navigation)
 */
export const trackPageView = (): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};
