
import * as Updates from 'expo-updates';

export class UpdateService {
  static async checkForUpdates(): Promise<boolean> {
    try {
      if (__DEV__) {
        console.log('Updates disabled in development mode');
        return false;
      }

      const update = await Updates.checkForUpdateAsync();
      return update.isAvailable;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  static async downloadAndReloadAsync(): Promise<void> {
    try {
      if (__DEV__) {
        console.log('Updates disabled in development mode');
        return;
      }

      const update = await Updates.fetchUpdateAsync();
      if (update.isNew) {
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.error('Error downloading and reloading update:', error);
      throw error;
    }
  }

  static async getUpdateInfo(): Promise<any> {
    try {
      return {
        updateId: Updates.updateId,
        releaseChannel: Updates.releaseChannel,
        isEmbeddedLaunch: Updates.isEmbeddedLaunch,
        isEmergencyLaunch: Updates.isEmergencyLaunch,
      };
    } catch (error) {
      console.error('Error getting update info:', error);
      return null;
    }
  }

  static onUpdateEvent(listener: (event: Updates.UpdateEvent) => void): Updates.EventSubscription {
    return Updates.addListener(listener);
  }
}
