export function areFormValuesEqual<T>(initialValue: T, currentValue: T): boolean {
  return JSON.stringify(initialValue) === JSON.stringify(currentValue);
}
