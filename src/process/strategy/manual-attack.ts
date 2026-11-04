/* global COLOR_RED COLOR_ORANGE COLOR_YELLOW */

import container from 'utils/container';
import hivemind from 'hivemind';
import Process from 'process/process';
import SquadManager from 'manager.squad';

/**
 * Flag-controlled manual attack process.
 *
 * Usage:
 *   1. Place a flag in the room you want to attack. Name it `Attack` or
 *      `Attack:<label>` to run multiple squads simultaneously.
 *   2. Choose a flag color to select the squad composition:
 *      - RED   (primary) → attacker + healer  (melee brawler pair)
 *      - ORANGE           → ranger + healer    (ranged pair, default)
 *      - YELLOW           → blinky             (self-healing ranged solo)
 *   3. The closest owned room with RCL ≥ 3 and enough energy is picked
 *      automatically as the spawn room.
 *   4. Remove the flag to disband the squad.
 *
 * The internal squad name is `attack:<flagName>` so you can manage it via
 * the console if needed:
 *   container.get('SquadManager').getSquad('attack:Attack').disband();
 */
export default class ManualAttackProcess extends Process {
	squadManager: SquadManager;

	constructor(parameters: ProcessParameters) {
		super(parameters);
		this.squadManager = container.get('SquadManager');
	}

	/**
	 * Main entry point – called every interval ticks by the kernel.
	 */
	run() {
		const attackFlags = _.filter(Game.flags, flag => flag.name.toLowerCase() === 'attack' || flag.name.toLowerCase().startsWith('attack:'));

		// Keep track of which squad names are still backed by a flag.
		const activeSquadNames = new Set<string>();

		for (const flag of attackFlags) {
			const squadName = 'attack:' + flag.name;
			activeSquadNames.add(squadName);
			this.manageFlagSquad(flag, squadName);
		}

		// Disband squads whose flag has been removed.
		this.cleanupOrphanedSquads(activeSquadNames);
	}

	/**
	 * Ensures the squad for the given flag exists with the correct setup.
	 */
	manageFlagSquad(flag: Flag, squadName: string) {
		const targetPos = flag.pos;
		const spawnRoom = this.findBestSpawnRoom(targetPos.roomName);

		if (!spawnRoom) {
			hivemind.log('military').info('[ManualAttack] No suitable spawn room found for flag', flag.name, '- waiting...');
			return;
		}

		const squad = this.squadManager.getOrCreateSquad(squadName);

		// Always refresh spawn room and target in case flag was moved.
		squad.setSpawn(spawnRoom);
		squad.setTarget(targetPos);

		// Only set composition once (avoids overwriting while units are alive).
		const composition = squad.getComposition();
		if (Object.keys(composition).length === 0) {
			const units = this.getUnitsForFlag(flag);
			for (const [unitType, count] of Object.entries(units)) {
				squad.setUnitCount(unitType as SquadUnitType, count);
			}

			hivemind.log('military').info(
				'[ManualAttack] Squad', squadName,
				'created. Spawn:', spawnRoom,
				'Target:', targetPos.roomName,
				'Units:', JSON.stringify(units),
			);
		}
	}

	/**
	 * Returns the unit composition for a flag based on its primary color.
	 *
	 *  COLOR_RED    →  attacker + healer  (melee brawler pair)
	 *  COLOR_ORANGE →  ranger + healer    (ranged pair, default)
	 *  COLOR_YELLOW →  blinky             (self-healing ranged solo)
	 */
	getUnitsForFlag(flag: Flag): Partial<Record<SquadUnitType, number>> {
		switch (flag.color) {
			case COLOR_RED:
				return {attacker: 1, healer: 1};

			case COLOR_YELLOW:
				return {blinky: 1};

			// COLOR_ORANGE or anything else → ranger + healer
			default:
				return {ranger: 1, healer: 1};
		}
	}

	/**
	 * Finds the closest owned room suitable for spawning an attack squad.
	 * Requirements: RCL ≥ 3 and ≥ 5 000 available energy.
	 */
	findBestSpawnRoom(targetRoomName: string): string | null {
		let bestRoom: Room | null = null;
		let bestDistance = Infinity;

		for (const room of Game.myRooms) {
			if (!room.controller || room.controller.level < 3) continue;
			if (room.getEffectiveAvailableEnergy() < 5_000) continue;

			const distance = Game.map.getRoomLinearDistance(room.name, targetRoomName);
			if (distance < bestDistance) {
				bestDistance = distance;
				bestRoom = room;
			}
		}

		return bestRoom ? bestRoom.name : null;
	}

	/**
	 * Disbands squads that no longer have a corresponding flag.
	 */
	cleanupOrphanedSquads(activeSquadNames: Set<string>) {
		for (const squadName in (Memory.squads || {})) {
			if (!squadName.startsWith('attack:')) continue;
			if (activeSquadNames.has(squadName)) continue;

			const squad = this.squadManager.getSquad(squadName);
			if (squad) {
				hivemind.log('military').info('[ManualAttack] Disbanding squad', squadName, '- flag removed.');
				squad.disband();
			}

			delete Memory.squads[squadName];
		}
	}
}


