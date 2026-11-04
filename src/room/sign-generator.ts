import container from "utils/container";

export enum RoomSignType {
    Owned = 'owned',
    Remote = 'remote',
    Other = 'other',
}

const signTemplates: Record<RoomSignType, string[]> = {
    [RoomSignType.Owned]: [
        "I only know 25 letters of the alphabet. I don't know y.",
        "Why don't eggs tell jokes? They'd crack each other up.",
        "I used to hate facial hair, but then it grew on me.",
        "What do you call fake spaghetti? An impasta.",
        "I don't trust stairs. They're always up to something.",
        "I ordered a chicken and an egg online. I'll let you know.",
        "How do you organize a space party? You planet.",
        "I used to be a banker, but I lost interest.",
        "What do you call cheese that isn't yours? Nacho cheese.",
        "I'm reading a book about anti-gravity. It's impossible to put down.",
        "I would avoid the sushi if I were you. It's a little fishy.",
        "How do you make holy water? You boil the heck out of it.",
        "Why did the scarecrow win an award? He was outstanding in his field.",
        "What do you call a factory that makes okay products? A satisfactory.",
        "Why did the math book look sad? It had too many problems.",
        "How does a penguin build its house? Igloos it together.",
        "I got hit in the head with a can of soda. Luckily it was a soft drink.",
        "What do you call a belt made of watches? A waist of time.",
        "Why can't your nose be 12 inches long? Because then it'd be a foot.",
        "I used to play piano by ear, now I use my hands.",
        "What did one wall say to the other wall? I'll meet you at the corner.",
        "Why did the coffee file a police report? It got mugged.",
        "What do you call a can opener that doesn't work? A can't opener.",
        "I used to be addicted to soap, but I'm clean now.",
        "What did one ocean say to the other ocean? Nothing, they just waved.",
        "Why did the bicycle fall over? It was two tired.",
        "How do you make a tissue dance? Put a little boogie in it.",
        "Why did the golfer bring two pairs of pants? In case he got a hole in one.",
        "I'm on a seafood diet. I see food and I eat it.",
        "How do trees get online? They log in.",
        "Why don't skeletons fight each other? They don't have the guts.",
        "What's orange and sounds like a parrot? A carrot.",
        "Why did the cookie go to the doctor? It felt crummy.",
        "What do you call a fish wearing a bowtie? Sofishticated.",
        "I don't trust atoms. They make up everything.",
        "What do you call a sleeping bull? A bulldozer.",
        "Why did the tomato blush? It saw the salad dressing.",
        "How does the moon cut its hair? Eclipse it.",
        "What did the janitor say when he jumped out of the closet? Supplies!",
        "Why did the computer go to the doctor? It had a virus.",
        "I know a lot of jokes about retired people, but none of them work.",
        "What do sprinters eat before a race? Nothing. They fast.",
        "Why did the stadium get hot? All the fans left.",
        "Why did the golfer bring an extra shirt? In case of a hole in one.",
        "What do you call a pile of cats? A meowtain.",
        "I used to be afraid of hurdles, but I got over it.",
        "Why did the picture go to jail? It was framed.",
        "What kind of music do planets like? Neptunes.",
        "What did the big flower say to the little flower? Hey, bud.",
        "How do you fix a broken pumpkin? With a pumpkin patch.",
        "What do you call two monkeys sharing an Amazon account? Prime mates.",
        "Why are elevator jokes so classic? They work on many levels.",
        "I used to be a baker, but I couldn't make enough dough.",
        "Why did the barber win the race? He took a short cut.",
        "What do you call a boomerang that won't come back? A stick.",
        "Why did the pony sing a lullaby? It was a little hoarse.",
        "I once had a fear of speed bumps, but I'm slowly getting over it.",
        "What did the grape do when it got stepped on? It let out a little wine.",
        "What do you call a bear with no teeth? A gummy bear.",
        "Why did the bee get married? It found its honey.",
        "How do cows stay up to date? They read the moo-spaper.",
        "Why did the banana go to the doctor? It wasn't peeling well.",
        "What do you call a snowman in summer? A puddle.",
        "What did one plate say to the other plate? Lunch is on me.",
        "How do you make a lemon drop? Just let it fall.",
        "Why did the cookie cry? Its mom was a wafer too long.",
        "What do you call a dinosaur with an extensive vocabulary? A thesaurus.",
        "What do you call a bee that can't make up its mind? A maybe.",
        "Why did the music teacher need a ladder? To reach the high notes.",
        "How do you catch a squirrel? Climb a tree and act like a nut.",
        "Why don't seagulls fly over the bay? Because then they'd be bagels.",
        "What kind of shoes do ninjas wear? Sneakers.",
        "Why did the calendar break up? Its days were numbered.",
        "What do you call a line of rabbits hopping backward? A receding hare-line.",
        "I got a job at a bakery because I kneaded dough.",
        "What do you call a cow with no legs? Ground beef.",
        "How do you know a joke is a dad joke? It becomes apparent.",
        "I only tell dad jokes occasionally. When I'm in a parent mood.",
        "Why did the scarecrow keep getting promoted? He was outstanding in his field.",
        "Why can't you hear a pterodactyl use the restroom? Because the P is silent.",
        "Why did the frog take the bus to work? His car got toad away.",
        "Why are fish so smart? They live in schools.",
        "What did one hat say to the other hat? You stay here, I'll go on ahead.",
        "Why don't oysters share? They're shellfish.",
        "How do you make an octopus laugh? With ten tickles.",
        "What do you call a very small valentine? A valen-tiny.",
        "I used to be indecisive. Now I'm not so sure.",
        "Why did the orange stop halfway up the hill? It ran out of juice.",
        "What did the buffalo say to his son when he left? Bison.",
        "How do you find Will Smith in the snow? Look for fresh prints.",
        "Why was the broom late? It swept in.",
        "What did the zero say to the eight? Nice belt.",
        "What do you call a dog magician? A labracadabrador.",
        "Why did the golfer bring a ladder? To reach the next level.",
        "What kind of key opens a banana? A mon-key.",
        "How does a scientist freshen breath? With experi-mints.",
        "What did the left eye say to the right eye? Between us, something smells.",
        "Why was six afraid of seven? Because seven eight nine.",
        "What do you call a pig that does karate? A pork chop.",
        "Why did the teddy bear skip dessert? It was stuffed."
    ],
    [RoomSignType.Remote]: [
        'Mine!',
    ],
    [RoomSignType.Other]: [],
}

export default class RoomSignGenerator {
    public generateSign(roomName: string) {
        const roomType = this.getRoomType(roomName);
        const randomSeed = this.getRandomSeed(roomName);
        
        return this.getRandomSign(roomName, roomType, randomSeed);
    }

    private getRoomType(roomName: string): RoomSignType {
        if (Game.rooms[roomName]?.isMine()) {
            return RoomSignType.Owned;
        }

        if ((Memory.strategy?.remoteHarvesting?.rooms || []).includes(roomName)) {
            return RoomSignType.Remote;
        }

        return RoomSignType.Other;
    }

    private getRandomSeed(roomName: string): number {
        // Use the room name as a seed for reproducibility.
        // The result should be semi-random so W4N5 and W5N4 will not have the same sign.
        let seed = 0;
        for (let i = 0; i < roomName.length; i++) {
            seed += roomName.charCodeAt(i) * (i + 1);
        }
        
        return Math.floor(seed % 1000); // Limit the seed to a manageable range
    }

    private getRandomSign(roomName: string, roomType: RoomSignType, seed: number): string | null {
        const signs = signTemplates[roomType];
        if (!signs || signs.length === 0) {
            const roomStatus = container.get('RoomStatus');
            const isCloseRoom = roomStatus.hasRoom(roomName) && roomStatus.getDistanceToOrigin(roomName) <= 2;

            if (roomType === RoomSignType.Owned || roomType === RoomSignType.Remote || isCloseRoom) {
                return '';
            }

            return null;
        }

        const index = seed % signs.length;
        
        return signs[index];
    }
}
