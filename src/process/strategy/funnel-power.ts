/* global RESOURCE_ENERGY RESOURCE_POWER OK */

import container from 'utils/container';
import hivemind from 'hivemind';
import Process from 'process/process';
import {getRoomIntel} from 'room-intel';
import {markTerminalUsed, wasTerminalUsedThisTick} from 'utils/terminal-usage';

/**
 * Maximum amount of power to send in a single terminal transaction.
 */
const MAX_SEND_AMOUNT = 10_000;

/**
 * Don't bother sending less than this; it would just put the terminal on
 * cooldown for very little gain.
 */
const MIN_SEND_AMOUNT = 500;

/**
 * Rooms with less energy than this won't spend energy on sending power.
 */
const MIN_ROOM_ENERGY = 30_000;

/**
 * Sends our power to nearby rooms of a friendly player so they can process
 * it in their power spawns.
 *
 * Target rooms are RCL 8 rooms owned by the `powerFunnelPlayer` setting that
 * are within `powerFunnelMaxDistance` linear rooms of the sending room. If that
 * player has posted a simpleAllies power request for one of those rooms (and
 * is in our allies list), that room is preferred. Otherwise the closest room
 * is used.
 */
export default class FunnelPowerProcess extends Process {
	run() {
		const playerName = hivemind.settings.get('powerFunnelPlayer');
		if (!playerName) return;
		if (!hivemind.segmentMemory.isReady()) return;

		const targetRooms = this.getTargetRooms(playerName);
		if (targetRooms.length === 0) {
			hivemind.log('trade').debug('FunnelPower: No RCL 8 rooms known for player', playerName);
			return;
		}

		const maxDistance = hivemind.settings.get('powerFunnelMaxDistance');
		const reserve = hivemind.settings.get('powerFunnelReserve');

		for (const room of Game.myRooms) {
			const terminal = room.terminal;
			if (!terminal || !terminal.isOperational()) continue;

			const surplus = room.getCurrentResourceAmount(RESOURCE_POWER) - reserve;
			if (surplus < MIN_SEND_AMOUNT) continue;

			const targetRoom = this.getBestTargetRoom(room.name, targetRooms, maxDistance);
			if (!targetRoom) continue;

			this.funnelFromRoom(room, targetRoom, Math.min(surplus, MAX_SEND_AMOUNT), playerName);
		}
	}

	/**
	 * Finds rooms owned by the target player that are able to process power.
	 */
	getTargetRooms(playerName: string): string[] {
		const playerIntel = container.get('PlayerIntelManager').get(playerName);

		return playerIntel.getAllOwnedRooms().filter(roomName => {
			const roomIntel = getRoomIntel(roomName);
			return roomIntel.getOwner() === playerName && roomIntel.getRcl() >= 8;
		});
	}

	/**
	 * Picks the room to send power to from the given room.
	 *
	 * Rooms that currently request power through simpleAllies come first,
	 * closest room otherwise.
	 */
	getBestTargetRoom(roomName: string, targetRooms: string[], maxDistance: number): string | null {
		const powerRequests = Memory.requests?.trade?.[RESOURCE_POWER] || {};

		let best: string | null = null;
		let bestScore = -Infinity;
		for (const targetRoom of targetRooms) {
			const distance = Game.map.getRoomLinearDistance(roomName, targetRoom, true);
			if (distance > maxDistance) continue;

			const request = powerRequests[targetRoom];
			const isRequesting = request && (request.timeout ?? request.lastSeen + 100) >= Game.time;
			const score = (isRequesting ? 100 + (request.priority || 0) : 0) - (distance / (maxDistance + 1));

			if (score > bestScore) {
				bestScore = score;
				best = targetRoom;
			}
		}

		return best;
	}

	/**
	 * Sends power from a room's terminal, or asks for the terminal to be
	 * filled with power if there isn't enough in it yet.
	 */
	funnelFromRoom(room: Room, targetRoom: string, wantedAmount: number, playerName: string) {
		const terminal = room.terminal;
		const terminalPower = terminal.store.getUsedCapacity(RESOURCE_POWER);

		// Most power lives in storage. Have it moved to the terminal so we can
		// send it next time, unless the terminal is already being filled with
		// something else.
		if (terminalPower < wantedAmount && !room.memory.fillTerminal) {
			room.prepareForTrading(RESOURCE_POWER, wantedAmount);
		}

		if (terminal.cooldown > 0) return;
		if (wasTerminalUsedThisTick(terminal)) return;
		if (room.getEffectiveAvailableEnergy() < MIN_ROOM_ENERGY) return;

		let amount = Math.min(wantedAmount, terminalPower);
		if (amount < MIN_SEND_AMOUNT) return;

		const energyCost = Game.market.calcTransactionCost(amount, room.name, targetRoom);
		const availableEnergy = terminal.store.getUsedCapacity(RESOURCE_ENERGY);
		if (energyCost > availableEnergy) {
			amount = Math.floor(amount * availableEnergy / energyCost);
			if (amount < MIN_SEND_AMOUNT) {
				hivemind.log('trade').info('FunnelPower: Not enough energy in terminal of', room.name, 'to send power to', targetRoom);
				return;
			}
		}

		const result = terminal.send(RESOURCE_POWER, amount, targetRoom, 'Power for ' + playerName);
		hivemind.log('trade').info('FunnelPower: Sent', amount, 'power from', room.name, 'to', targetRoom, ':', result);
		if (result !== OK) return;

		markTerminalUsed(terminal);
	}
}
