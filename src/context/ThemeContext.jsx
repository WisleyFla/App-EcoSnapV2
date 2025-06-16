import React, { createContext, useContext, useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Carregar tema salvo
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { value } = await Preferences.get({ key: 'theme' });
        if (value) {
          setIsDarkMode(value === 'dark');
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
      }
    };

    loadTheme();
  }, []);

  // Aplicar tema no documento
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Alternar tema
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    try {
      await Preferences.set({
        key: 'theme',
        value: newTheme ? 'dark' : 'light'
      });
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  };

  const value = {
    isDarkMode,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}