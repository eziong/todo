// =============================================
// EVENT PROVIDER COMPONENT
// =============================================
// Provider component for event context management

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// =============================================
// TYPES
// =============================================

interface RequestContext {
  sessionId: string;
  source: 'web' | 'mobile';
  userAgent: string;
}

interface ClientEventContextType {
  sessionId: string;
  source: 'web' | 'mobile';
  setContext: (context: Partial<RequestContext>) => void;
  getContext: () => Partial<RequestContext>;
}

// =============================================
// CONTEXT
// =============================================

const ClientEventContext = createContext<ClientEventContextType | undefined>(undefined);

// =============================================
// HELPER FUNCTIONS
// =============================================

const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// =============================================
// PROVIDER COMPONENT
// =============================================

export const EventContextProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Initialize session ID on mount
    const storedContext = JSON.parse(
      sessionStorage.getItem('eventContext') || '{}'
    );
    
    const newSessionId = storedContext.sessionId || generateSessionId();
    setSessionId(newSessionId);

    // Detect if mobile
    const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
    
    const context: Partial<RequestContext> = {
      sessionId: newSessionId,
      source: isMobile ? 'mobile' : 'web',
      userAgent: navigator.userAgent
    };

    sessionStorage.setItem('eventContext', JSON.stringify(context));
  }, []);

  const setContext = (context: Partial<RequestContext>) => {
    const existingContext = JSON.parse(
      sessionStorage.getItem('eventContext') || '{}'
    );
    const newContext = { ...existingContext, ...context };
    sessionStorage.setItem('eventContext', JSON.stringify(newContext));
  };

  const getContext = (): Partial<RequestContext> => {
    return JSON.parse(
      sessionStorage.getItem('eventContext') || '{}'
    );
  };

  const value = {
    sessionId,
    source: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' as const : 'web' as const,
    setContext,
    getContext
  };

  return (
    <ClientEventContext.Provider value={value}>
      {children}
    </ClientEventContext.Provider>
  );
});

// =============================================
// HOOK
// =============================================

export const useClientEventContext = (): ClientEventContextType => {
  const context = useContext(ClientEventContext);
  if (context === undefined) {
    throw new Error('useClientEventContext must be used within an EventContextProvider');
  }
  return context;
};