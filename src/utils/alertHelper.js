// Helper to show themed notification - use this instead of Alert.alert
import {useNotification} from '../contexts/NotificationContext';

export const showAlert = (title, message, buttons = [{text: 'OK'}]) => {
  // This needs to be called from within a component using the hook
  // For immediate use, import and use:
  // const {showNotification} = useNotification();
  // showNotification(title, message, buttons);
};

// Usage in components:
// Replace: Alert.alert('Title', 'Message', buttons)  
// With: showNotification('Title', 'Message', buttons)
