import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const DEFAULT_SETTINGS = {
  branding: {
    logoUrl: '',
    companyName: 'SimpleAnonymousScheduler',
    templateText: 'Welcome to SimpleAnonymousScheduler',
  },
  preferences: {
    dateFormat: 'MM/dd/yyyy',
    timezone: 'UTC',
  },
  supportEmail: '',
};

const AppSettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
});

export const AppSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/public-settings');
        if (mounted && res.data) {
          setSettings({
            branding: {
              ...DEFAULT_SETTINGS.branding,
              ...(res.data.branding || {}),
            },
            preferences: {
              ...DEFAULT_SETTINGS.preferences,
              ...(res.data.preferences || {}),
            },
            supportEmail: res.data.supportEmail || '',
          });
        }
      } catch (_err) {
        // Keep defaults if settings are unavailable.
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => ({ settings, loading }), [settings, loading]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => useContext(AppSettingsContext);
