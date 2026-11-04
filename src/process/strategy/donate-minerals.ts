/* global RESOURCE_ENERGY RESOURCE_CATALYZED_UTRIUM_ACID RESOURCE_CATALYZED_KEANIUM_ALKALIDE
RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE RESOURCE_CATALYZED_GHODIUM_ALKALIDE
RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE */

import container from 'utils/container';
import hivemind from 'hivemind';
import Process from 'process/process';
import {getRoomIntel} from 'room-intel';
import {markTerminalUsed, wasTerminalUsedThisTick} from 'utils/terminal-usage';

/**
 * Player name to donate T3 combat minerals to.
 */
const DONATE_TARGET = 'Raykazi';

/**
 * Maximum amount of each mineral to donate per source terminal per cycle.
 */
const DONATION_AMOUNT = 1000;

/**
 * T3 (catalyzed) combat minerals to donate.
 * Covers attack, ranged attack, heal, tough, and move boosts.
 */
const T3_COMBAT_MINERALS: ResourceConstant[] = [
	RESOURCE_CATALYZED_UTRIUM_ACID,        // XUH2O - attack
	RESOURCE_CATALYZED_KEANIUM_ALKALIDE,   // XKHO2 - ranged attack
	RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE, // XLHO2 - heal
	RESOURCE_CATALYZED_GHODIUM_ALKALIDE,   // XGHO2 - tough
	RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,  // XZHO2 - move
];

/**
 * Donates T3 combat minerals to a friendly player's terminals on a fixed
 * interval.
 */
export default class DonateMineralsProcess extends Process {
	run() {
		if (!hivemind.segmentMemory.isReady()) return;

		const targetRooms = this.getTargetRooms();
		if (targetRooms.length === 0) {
			hivemind.log('trade').debug('DonateMinerals: No suitable rooms found for player', DONATE_TARGET);
			return;
		}

		for (const room of Game.myRooms) {
			if (!room.terminal) continue;
			if (room.terminal.cooldown > 0) continue;
			if (wasTerminalUsedThisTick(room.terminal)) continue;

			this.donateFromRoom(room, targetRooms);
		}
	}

	/**
	 * Finds rooms owned by the donation target that have a terminal (RCL 6+).
	 */
	getTargetRooms(): string[] {
		const manager = container.get('PlayerIntelManager');
		const playerIntel = manager.get(DONATE_TARGET);

		return playerIntel.getAllOwnedRooms().filter(roomName => {
			return getRoomIntel(roomName).getRcl() >= 6;
		});
	}

	/**
	 * Attempts to donate one T3 combat mineral from the given room to the
	 * closest target room. Only one send is performed per terminal per tick.
	 */
	donateFromRoom(room: Room, targetRooms: string[]) {
		const terminal = room.terminal;
		const targetRoom = this.getClosestRoom(room.name, targetRooms);
		if (!targetRoom) return;

		for (const mineral of T3_COMBAT_MINERALS) {
			const available = terminal.store.getUsedCapacity(mineral);
			if (!available) continue;

			const amount = Math.min(available, DONATION_AMOUNT);
			const energyCost = Game.market.calcTransactionCost(amount, room.name, targetRoom);
			const energyAvailable = terminal.store.getUsedCapacity(RESOURCE_ENERGY);

			if (energyCost > energyAvailable) {
				hivemind.log('trade').info(
					'DonateMinerals: Insufficient energy in', room.name,
					'to send', amount, mineral, 'to', targetRoom,
					'(need', energyCost, '/',  energyAvailable, 'available)',
				);
				continue;
			}

			const result = terminal.send(mineral, amount, targetRoom, 'Donation to ' + DONATE_TARGET);
			hivemind.log('trade').info('DonateMinerals: Sent', amount, mineral, 'from', room.name, 'to', targetRoom, ':', result);

			// Each terminal can only send once per tick.
			if (result === OK) {
				markTerminalUsed(terminal);
				return;
			}
		}
	}

	/**
	 * Returns the candidate room with the shortest linear distance from
	 * `roomName`, or null if the list is empty.
	 */
	getClosestRoom(roomName: string, candidates: string[]): string | null {
		if (candidates.length === 0) return null;

		let closest = candidates[0];
		let minDistance = Game.map.getRoomLinearDistance(roomName, closest);

		for (let i = 1; i < candidates.length; i++) {
			const distance = Game.map.getRoomLinearDistance(roomName, candidates[i]);
			if (distance < minDistance) {
				minDistance = distance;
				closest = candidates[i];
			}
		}

		return closest;
	}
}
