
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as KeepAwake from 'expo-keep-awake';

export interface DeliverySchedule {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  merchantContact?: any;
  driverContact?: any;
  notes?: string;
}

export class SchedulingService {
  // Calendar Methods
  static async requestCalendarPermission(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting calendar permission:', error);
      return false;
    }
  }

  static async getCalendars(): Promise<Calendar.Calendar[]> {
    try {
      const hasPermission = await this.requestCalendarPermission();
      if (!hasPermission) return [];

      return await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    } catch (error) {
      console.error('Error getting calendars:', error);
      return [];
    }
  }

  static async createDeliveryEvent(schedule: DeliverySchedule): Promise<string | null> {
    try {
      const hasPermission = await this.requestCalendarPermission();
      if (!hasPermission) return null;

      const calendars = await this.getCalendars();
      const defaultCalendar = calendars.find(cal => cal.source.name === 'Default') || calendars[0];

      if (!defaultCalendar) return null;

      const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
        title: schedule.title,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        location: schedule.location,
        notes: schedule.notes,
        alarms: [
          { relativeOffset: -30 }, // 30 minutes before
          { relativeOffset: -10 }, // 10 minutes before
        ],
      });

      return eventId;
    } catch (error) {
      console.error('Error creating delivery event:', error);
      return null;
    }
  }

  // Contacts Methods
  static async requestContactsPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  }

  static async getMerchantContact(merchantId: string): Promise<any> {
    try {
      const hasPermission = await this.requestContactsPermission();
      if (!hasPermission) return null;

      // Search for merchant in contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      return data.find(contact => 
        contact.name?.includes(`Merchant-${merchantId}`) || 
        contact.company === 'BrillPrime Merchant'
      );
    } catch (error) {
      console.error('Error getting merchant contact:', error);
      return null;
    }
  }

  static async addMerchantToContacts(merchant: any): Promise<string | null> {
    try {
      const hasPermission = await this.requestContactsPermission();
      if (!hasPermission) return null;

      const contactId = await Contacts.addContactAsync({
        name: `${merchant.businessName} - BrillPrime`,
        firstName: merchant.ownerName || merchant.businessName,
        company: 'BrillPrime Merchant',
        phoneNumbers: merchant.phone ? [{ number: merchant.phone, isPrimary: true }] : [],
        emails: merchant.email ? [{ email: merchant.email, isPrimary: true }] : [],
        note: `Merchant ID: ${merchant.id}`,
      });

      return contactId;
    } catch (error) {
      console.error('Error adding merchant to contacts:', error);
      return null;
    }
  }

  // Keep Awake Methods (for delivery tracking)
  static enableKeepAwake(reason: string = 'Tracking delivery'): void {
    try {
      KeepAwake.activateKeepAwake(reason);
      console.log('Keep awake activated:', reason);
    } catch (error) {
      console.error('Error activating keep awake:', error);
    }
  }

  static disableKeepAwake(): void {
    try {
      KeepAwake.deactivateKeepAwake();
      console.log('Keep awake deactivated');
    } catch (error) {
      console.error('Error deactivating keep awake:', error);
    }
  }

  // Integrated delivery scheduling
  static async scheduleDelivery(deliveryData: {
    orderId: string;
    merchantId: string;
    driverId?: string;
    scheduledTime: Date;
    estimatedDuration: number; // in minutes
    deliveryAddress: string;
  }): Promise<boolean> {
    try {
      const schedule: DeliverySchedule = {
        id: deliveryData.orderId,
        title: `BrillPrime Delivery - Order ${deliveryData.orderId}`,
        startDate: deliveryData.scheduledTime,
        endDate: new Date(deliveryData.scheduledTime.getTime() + deliveryData.estimatedDuration * 60000),
        location: deliveryData.deliveryAddress,
        notes: `Order ID: ${deliveryData.orderId}\nMerchant ID: ${deliveryData.merchantId}${deliveryData.driverId ? `\nDriver ID: ${deliveryData.driverId}` : ''}`,
      };

      const eventId = await this.createDeliveryEvent(schedule);
      
      if (eventId) {
        console.log('Delivery scheduled successfully:', eventId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error scheduling delivery:', error);
      return false;
    }
  }
}
