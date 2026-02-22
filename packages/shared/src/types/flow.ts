export interface FlowEmitter {
  emit(event: string, data?: Record<string, unknown>): void;
}

export interface StepResult<T> {
  success: true;
  data: T;
}

export interface FlowError {
  success: false;
  error: {
    code: string;
    message: string;
    step?: string;
    severity: 'error' | 'fatal' | 'warning';
    recoverable: boolean;
    details?: Record<string, unknown>;
  };
}

export type FlowResult<T> = StepResult<T> | FlowError;
