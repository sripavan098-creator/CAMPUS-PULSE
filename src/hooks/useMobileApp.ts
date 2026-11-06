import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Hook to manage native Android mobile behaviors:
 * - Status bar styling and theme synchronization
 * - Hardware / Gesture back button intercepting and routing
 */
export const useMobileApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPress = useRef<number>(0);

  // Initialize Android Status Bar
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#142B4A' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        console.warn('Notice: StatusBar plugin not active in this environment', err);
      }
    };

    setupStatusBar();
  }, []);

  // Register Android Hardware Back Button listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapApp.addListener('backButton', () => {
      // 1. Give active modals or drawers first opportunity to close
      const backEvent = new CustomEvent('campus_pulse_hardware_back', { cancelable: true });
      const eventHandled = !window.dispatchEvent(backEvent);

      if (eventHandled) {
        return;
      }

      // 2. If at root route '/', handle exit gracefully
      const isRoot = location.pathname === '/' || location.pathname === '';
      if (isRoot) {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          CapApp.exitApp();
        } else {
          lastBackPress.current = now;
        }
      } else {
        // 3. Pop history stack
        navigate(-1);
      }
    });

    return () => {
      backListener.then((handle: any) => handle.remove()).catch(() => {});
    };
  }, [location.pathname, navigate]);
};
