
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';

export const useDeepLinking = () => {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Handle initial URL if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep link changes while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    const { hostname, path, queryParams } = Linking.parse(url);

    // Handle product links: brillprime://product/123 or https://brillprime.com/product/123
    if (path?.startsWith('product/')) {
      const productId = path.replace('product/', '');
      router.push(`/commodity/${productId}`);
    }
    // Handle merchant links: brillprime://merchant/456 or https://brillprime.com/merchant/456
    else if (path?.startsWith('merchant/')) {
      const merchantId = path.replace('merchant/', '');
      router.push(`/merchant/${merchantId}`);
    }
    // Handle order tracking: brillprime://order/789
    else if (path?.startsWith('order/')) {
      const orderId = path.replace('order/', '');
      router.push(`/orders/order-details?orderId=${orderId}`);
    }
  };

  return { handleDeepLink };
};
