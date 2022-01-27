import Vec2, { vec2 } from './Vector2.js';
export function toHex(value) { return '0x' + value.toString(16).padStart(8, '0'); }
export const valueWithSeparators = (value) => value.toLocaleString('en-US').replace(',', ' ');
export { Vec2, vec2 };
