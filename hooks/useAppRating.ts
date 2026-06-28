
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { useAlert } from '../components/AlertProvider';

const RATING_PROMPT_KEY = 'lastRatingPrompt';
const RATING_GIVEN_KEY = 'ratingGiven';
const DAYS_BETWEEN_PROMPTS = 30;
const ACTIONS_BEFORE_PROMPT = 10;

export const useAppRating = () => {
  const { showConfirmDialog } = useAlert();
  const [actionCount, setActionCount] = useState(0);

  useEffect(() => {
    loadActionCount();
  }, []);

  const loadActionCount = async () => {
    try {
      const count = await AsyncStorage.getItem('actionCount');
      setActionCount(count ? parseInt(count) : 0);
    } catch (error) {
      console.error('Error loading action count:', error);
    }
  };

  const incrementActionCount = async () => {
    const newCount = actionCount + 1;
    setActionCount(newCount);
    await AsyncStorage.setItem('actionCount', newCount.toString());

    if (newCount >= ACTIONS_BEFORE_PROMPT) {
      await checkAndPromptRating();
    }
  };

  const checkAndPromptRating = async () => {
    try {
      const ratingGiven = await AsyncStorage.getItem(RATING_GIVEN_KEY);
      if (ratingGiven === 'true') return;

      const lastPrompt = await AsyncStorage.getItem(RATING_PROMPT_KEY);
      const now = Date.now();

      if (!lastPrompt || now - parseInt(lastPrompt) > DAYS_BETWEEN_PROMPTS * 24 * 60 * 60 * 1000) {
        await promptForRating();
      }
    } catch (error) {
      console.error('Error checking rating prompt:', error);
    }
  };

  const promptForRating = async () => {
    const isAvailable = await StoreReview.isAvailableAsync();

    if (isAvailable) {
      showConfirmDialog(
        'Enjoying Brill Prime?',
        'Rate us on the app store and help us improve!',
        async () => {
          await StoreReview.requestReview();
          await AsyncStorage.setItem(RATING_PROMPT_KEY, Date.now().toString());
          await AsyncStorage.setItem(RATING_GIVEN_KEY, 'true');
          await AsyncStorage.setItem('actionCount', '0');
          setActionCount(0);
        },
        async () => {
          await AsyncStorage.setItem(RATING_PROMPT_KEY, Date.now().toString());
        }
      );
    }
  };

  return { incrementActionCount, promptForRating };
};
