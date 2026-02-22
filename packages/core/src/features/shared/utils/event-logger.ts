import type { FlowEmitter } from '@nori/shared';

export function createEventLogger(label?: string): FlowEmitter {
  const prefix = label ? `[${label}]` : '[flow]';
  return {
    emit: (event: string, data?: Record<string, unknown>) => {
      console.log(`${prefix} ${event}`, data ?? '');
    },
  };
}
