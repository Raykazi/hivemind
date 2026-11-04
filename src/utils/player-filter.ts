import {getRoomIntel} from 'room-intel';

/**
 * Checks whether a given room, or any room within `range` steps of it, is
 * owned or reserved by a player in the provided list.
 *
 * @param roomName
 *   The room to start the search from.
 * @param players
 *   List of player names to check against.
 * @param range
 *   How many room steps away to search. Defaults to 2.
 */
function isRoomNearPlayers(roomName: string, players: string[], range = 2): boolean {
	if (players.length === 0) return false;

	const visited = new Set<string>();
	const queue: Array<{room: string; depth: number}> = [{room: roomName, depth: 0}];

	while (queue.length > 0) {
		const {room, depth} = queue.shift();
		if (visited.has(room)) continue;
		visited.add(room);

		const roomIntel = getRoomIntel(room);
		const owner = roomIntel.getOwner();
		const reservation = roomIntel.getReservationStatus();

		if (owner && players.includes(owner)) return true;
		if (reservation?.username && players.includes(reservation.username)) return true;

		if (depth < range) {
			for (const exitRoom of Object.values(roomIntel.getExits())) {
				if (!visited.has(exitRoom)) {
					queue.push({room: exitRoom, depth: depth + 1});
				}
			}
		}
	}

	return false;
}

export {isRoomNearPlayers};
