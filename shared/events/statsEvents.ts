// ============================================================================
// Stats Event System - Decouples game features from Progress store
// ============================================================================

export type StatEventType = 'correct' | 'incorrect' | 'session_complete';

export interface StatEvent {
  type: StatEventType;
  contentType: 'kana' | 'kanji' | 'vocabulary';
  character: string;
  correctAnswer?: string;
  userAnswer?: string;
  timestamp: number;
  metadata?: {
    gameMode?: string;
    difficulty?: string;
    timeTaken?: number;
  };
}

class StatsEventBus {
  private listeners: Map<StatEventType, Set<(event: StatEvent) => void>> =
    new Map();

  subscribe(
    eventType: StatEventType,
    listener: (event: StatEvent) => void,
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  emit(event: StatEvent): void {
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }
  }
}

export const statsEvents = new StatsEventBus();

// Public API for game components
export const statsApi = {
  recordCorrect(
    contentType: StatEvent['contentType'],
    character: string,
    metadata?: StatEvent['metadata'],
  ) {
    statsEvents.emit({
      type: 'correct',
      contentType,
      character,
      timestamp: Date.now(),
      metadata,
    });
  },

  recordIncorrect(
    contentType: StatEvent['contentType'],
    character: string,
    userAnswer: string,
    correctAnswer: string,
    metadata?: StatEvent['metadata'],
  ) {
    statsEvents.emit({
      type: 'incorrect',
      contentType,
      character,
      userAnswer,
      correctAnswer,
      timestamp: Date.now(),
      metadata,
    });
  },

  recordSessionComplete(
    contentType: StatEvent['contentType'],
    metadata?: StatEvent['metadata'],
  ) {
    statsEvents.emit({
      type: 'session_complete',
      contentType,
      character: '',
      timestamp: Date.now(),
      metadata,
    });
  },
};
