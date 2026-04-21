import { useEffect, useState } from 'react';
import { guardianSettingsService, DEFAULT_GUARDIAN_SETTINGS } from '../services/guardianSettingsService';
import type { GuardianSettings } from '../types/guardian';

export default function useGuardianSettings() {
  const [settings, setSettings] = useState<GuardianSettings>(DEFAULT_GUARDIAN_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const refreshSettings = async () => {
    setIsLoading(true);
    try {
      const nextSettings = await guardianSettingsService.getSettings();
      setSettings(nextSettings);
    } catch (error) {
      console.error('Failed to load guardian settings:', error);
      setSettings(DEFAULT_GUARDIAN_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return {
    settings,
    isLoading,
    isSaving,
    refresh: refreshSettings,
    updateSettings: async (updates: Partial<GuardianSettings>) => {
      setIsSaving(true);
      try {
        const nextSettings = await guardianSettingsService.updateSettings(updates);
        setSettings(nextSettings);
        return nextSettings;
      } finally {
        setIsSaving(false);
      }
    },
  };
}
