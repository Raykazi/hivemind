/**
 * Tracks which terminals have already been told to send resources this tick.
 *
 * A terminal can only execute one send per tick. A second `send()` call in
 * the same tick still returns OK but replaces the earlier intent, so processes
 * that send from terminals use this to avoid overwriting each other.
 */
const usedTerminals: Record<string, number> = {};

export function markTerminalUsed(terminal: StructureTerminal) {
	usedTerminals[terminal.id] = Game.time;
}

export function wasTerminalUsedThisTick(terminal: StructureTerminal): boolean {
	return usedTerminals[terminal.id] === Game.time;
}
