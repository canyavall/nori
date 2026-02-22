import type { FlowEmitter } from '@nori/shared';

export function createNoopEmitter(): FlowEmitter {
  return { emit: () => {} };
}

export function createFlowEmitter(
  callback: (event: string, data?: Record<string, unknown>) => void
): FlowEmitter {
  return { emit: callback };
}

export function prefixedEmitter(emitter: FlowEmitter, prefix: string): FlowEmitter {
  return {
    emit: (event: string, data?: Record<string, unknown>) => emitter.emit(`${prefix}:${event}`, data),
  };
}
