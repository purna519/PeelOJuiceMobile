/**
 * Auth Event Emitter
 * Handles authentication-related events like token expiry
 */

// Custom minimal EventEmitter to avoid 'events' package dependency
class AuthEventEmitterClass {
  constructor() {
    this.listeners = {};
  }

  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return this; // Chaining
  }

  off(event, listenerToRemove) {
    if (!this.listeners[event]) return this;
    this.listeners[event] = this.listeners[event].filter(
      listener => listener !== listenerToRemove,
    );
    return this;
  }

  emit(event, ...args) {
    if (!this.listeners[event]) return false;
    this.listeners[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in listener for event ${event}:`, error);
      }
    });
    return true;
  }
}

const authEventEmitter = new AuthEventEmitterClass();

// Event names
export const AUTH_EVENTS = {
  TOKEN_EXPIRED: 'token_expired',
  LOGOUT_REQUIRED: 'logout_required',
  SESSION_INVALID: 'session_invalid',
};

export default authEventEmitter;
