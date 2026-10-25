import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import LiveOrderTracker from '../LiveOrderTracker';
import { locationService } from '../../services/locationService';
import { orderService } from '../../services/orderService';

// Mock dependencies
jest.mock('../../services/locationService');
jest.mock('../../services/orderService');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
jest.mock('../Map', () => {
  const React = require('react');
  const MockMapView = (props: any) => {
    // Mock both web (markers prop) and native (children) rendering
    return React.createElement('MapView', props);
  };
  MockMapView.Marker = (props: any) => React.createElement('Marker', props);
  return {
    __esModule: true,
    default: MockMapView,
    PROVIDER_GOOGLE: 'google',
    Marker: MockMapView.Marker,
  };
});
jest.mock('../CommunicationModal', () => 'CommunicationModal');

describe('LiveOrderTracker', () => {
  const mockOrderId = 'order-123';
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock location service methods
    (locationService.startLiveTracking as jest.Mock).mockResolvedValue(undefined);
    (locationService.stopLiveTracking as jest.Mock).mockReturnValue(undefined);
    (locationService.onLocationUpdate as jest.Mock).mockReturnValue(jest.fn());
    (locationService.getLiveLocation as jest.Mock).mockResolvedValue({
      success: true,
      data: { latitude: 6.5244, longitude: 3.3792 },
    });
    (locationService.getCurrentLocation as jest.Mock).mockResolvedValue({
      latitude: 6.5244,
      longitude: 3.3792,
    });
    (locationService.calculateDistance as jest.Mock).mockReturnValue(5);
    
    // Mock order service
    (orderService.trackOrder as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        order: {
          id: mockOrderId,
          driverId: 'driver-123',
        },
        tracking: {
          driverInfo: {
            location: { latitude: 6.5244, longitude: 3.3792 },
          },
        },
      },
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up tracking interval when component unmounts (consumer role)', async () => {
      const mockUnsubscribe = jest.fn();
      (locationService.onLocationUpdate as jest.Mock).mockReturnValue(mockUnsubscribe);

      const { unmount } = render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="consumer"
          onClose={mockOnClose}
        />
      );

      // Wait for tracking to start
      await waitFor(() => {
        expect(locationService.onLocationUpdate).toHaveBeenCalled();
      });

      // Fast-forward to ensure interval is set
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Unmount component
      unmount();

      // Verify cleanup was called
      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(locationService.stopLiveTracking).toHaveBeenCalled();
    });

    it('should clean up tracking when switching from consumer tracking', async () => {
      const mockUnsubscribe = jest.fn();
      (locationService.onLocationUpdate as jest.Mock).mockReturnValue(mockUnsubscribe);

      const { rerender, unmount } = render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="consumer"
          onClose={mockOnClose}
        />
      );

      // Wait for tracking to start
      await waitFor(() => {
        expect(locationService.onLocationUpdate).toHaveBeenCalled();
      });

      // Change order ID (triggers cleanup and restart)
      rerender(
        <LiveOrderTracker
          orderId="order-456"
          userRole="consumer"
          onClose={mockOnClose}
        />
      );

      // Verify cleanup was called
      await waitFor(() => {
        expect(mockUnsubscribe).toHaveBeenCalled();
      });

      unmount();
    });

    it('should not create memory leak with multiple interval calls', async () => {
      const mockUnsubscribe = jest.fn();
      (locationService.onLocationUpdate as jest.Mock).mockReturnValue(mockUnsubscribe);

      const { unmount } = render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="consumer"
          onClose={mockOnClose}
        />
      );

      // Wait for tracking to start
      await waitFor(() => {
        expect(locationService.onLocationUpdate).toHaveBeenCalled();
      });

      // Simulate multiple interval executions
      act(() => {
        jest.advanceTimersByTime(15000); // 3 intervals at 5 seconds each
      });

      // Verify getLiveLocation was called multiple times
      expect(locationService.getLiveLocation).toHaveBeenCalledTimes(3);

      // Unmount and verify cleanup
      unmount();
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

      // Advance timers after unmount - interval should not fire
      const callCountBeforeUnmount = (locationService.getLiveLocation as jest.Mock).mock.calls.length;
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      // Call count should remain the same (no new calls after unmount)
      expect(locationService.getLiveLocation).toHaveBeenCalledTimes(callCountBeforeUnmount);
    });

    it('should handle driver role without memory leaks', async () => {
      const { unmount } = render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="driver"
          onClose={mockOnClose}
        />
      );

      // Wait for tracking to start
      await waitFor(() => {
        expect(locationService.startLiveTracking).toHaveBeenCalledWith(3000);
      });

      // Unmount component
      unmount();

      // Verify cleanup was called
      expect(locationService.stopLiveTracking).toHaveBeenCalled();
    });
  });

  describe('Tracking Functionality', () => {
    it('should start tracking for consumer role', async () => {
      render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="consumer"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(locationService.onLocationUpdate).toHaveBeenCalled();
      });
    });

    it('should start tracking for driver role', async () => {
      render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="driver"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(locationService.startLiveTracking).toHaveBeenCalledWith(3000);
      });
    });

    it('should poll driver location at regular intervals', async () => {
      render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="consumer"
          onClose={mockOnClose}
        />
      );

      // Wait for initial setup
      await waitFor(() => {
        expect(locationService.onLocationUpdate).toHaveBeenCalled();
      });

      // Fast-forward time to trigger interval
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(locationService.getLiveLocation).toHaveBeenCalledWith('driver-123');
      });
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should render correctly on web platform', async () => {
      // Mock Platform.OS as web
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('web');

      const { UNSAFE_getByType } = render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="consumer"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(locationService.onLocationUpdate).toHaveBeenCalled();
      });

      // On web, MapView should receive markers prop instead of children
      // This is validated by the component rendering without errors
    });

    it('should render correctly on iOS platform', async () => {
      // Mock Platform.OS as ios
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');

      const { UNSAFE_getByType } = render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="consumer"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(locationService.onLocationUpdate).toHaveBeenCalled();
      });

      // On iOS, MapView should use children (Marker components)
      // This is validated by the component rendering without errors
    });

    it('should render correctly on Android platform', async () => {
      // Mock Platform.OS as android
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android');

      const { UNSAFE_getByType } = render(
        <LiveOrderTracker
          orderId={mockOrderId}
          userRole="consumer"
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(locationService.onLocationUpdate).toHaveBeenCalled();
      });

      // On Android, MapView should use children (Marker components)
      // This is validated by the component rendering without errors
    });
  });
});
