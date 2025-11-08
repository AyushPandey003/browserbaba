/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'lodash.debounce' {
  export interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  }

  export default function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: DebounceOptions
  ): T & { cancel: () => void; flush: () => ReturnType<T> };
}
