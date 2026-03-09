/**
 * Meta Pixel (Facebook Pixel) tracking utility
 * 
 * Make sure to replace 'YOUR_PIXEL_ID' in index.html with your actual Meta Pixel ID
 */

// Extend Window interface to include fbq
declare global {
  interface Window {
    fbq: (
      action: string,
      event: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Track a custom event with Meta Pixel
 * @param eventName - The name of the event (e.g., 'Purchase', 'AddToCart', 'InitiateCheckout')
 * @param params - Optional parameters for the event (e.g., { value: 100, currency: 'INR' })
 */
export const trackMetaEvent = (
  eventName: string,
  params?: Record<string, unknown>
): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  } else {
    console.warn('Meta Pixel not loaded. Event not tracked:', eventName);
  }
};

/**
 * Track a purchase event
 * @param value - The purchase value
 * @param currency - The currency code (default: 'INR')
 * @param orderId - Optional order ID
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
  };

  if (orderId) {
    params.content_ids = [orderId];
    params.content_name = packageType || 'Numerology Report';
  }

  trackMetaEvent('Purchase', params);
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
 * Track when user views a key section (e.g., pricing)
 */
export const trackViewContent = (
  contentName: string,
  value?: number,
  currency: string = 'INR'
): void => {
  const params: Record<string, unknown> = {
    content_name: contentName,
  };
  if (value !== undefined) {
    params.value = value;
    params.currency = currency;
  }
  trackMetaEvent('ViewContent', params);
};

/**
 * Track when user selects a package (AddToCart equivalent)
 */
export const trackAddToCart = (
  packageType: string,
  value: number,
  currency: string = 'INR'
): void => {
  trackMetaEvent('AddToCart', {
    content_name: packageType,
    value,
    currency,
  });
};

/**
 * Track when user completes form details (step 2 → 3)
 */
export const trackCompleteRegistration = (
  packageType: string,
  value: number,
  currency: string = 'INR'
): void => {
  trackMetaEvent('CompleteRegistration', {
    content_name: packageType,
    value,
    currency,
  });
};

/**
 * Track a page view (usually handled automatically, but can be used for SPA navigation)
 */
export const trackPageView = (): void => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};
