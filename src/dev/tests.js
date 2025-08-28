// Requirements
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fsp = fs.promises;
const projectRoot = path.join(__dirname, '../../');
const testRoot = path.join(projectRoot, 'test');
const originRoot = path.join(testRoot, 'origin');
const destinationRoot = path.join(testRoot, 'destination');


// Variables
let TS;


// Internal
const ensureDir = async (dir) => {
    await fsp.mkdir(dir, { recursive: true });
};


const writeFileWithMtime = async (filePath, content, mtimeMs) => {
    await ensureDir(path.dirname(filePath));
    await fsp.writeFile(filePath, content);
    const mtime = new Date(mtimeMs);
    await fsp.utimes(filePath, mtime, mtime);
};


const removeIfExists = async (target) => {
    await fsp.rm(target, { recursive: true, force: true });
};


const parseArgs = () => {
    const args = process.argv.slice(2);
    const out = { count: 100, extraDest: 0 };
    for (const a of args) {
        if (a.startsWith('--count=')) out.count = Math.max(0, parseInt(a.split('=')[1], 10) || 0);
        else if (a.startsWith('--extra-dest=')) out.extraDest = Math.max(0, parseInt(a.split('=')[1], 10) || 0);
    }
    return out;
};


const pick = arr => arr[Math.floor(Math.random() * arr.length)];


const pad3 = n => String(n).padStart(3, '0');


// Exported
const main = async () => {
    const { count, extraDest } = parseArgs();
    console.log('Rebuilding test fixtures at', testRoot);
    await removeIfExists(testRoot);
    await Promise.all([ensureDir(originRoot), ensureDir(destinationRoot)]);

    // Timestamps
    TS = {
        older: new Date('2024-01-01T01:01:01.001Z').getTime(),
        mid: new Date('2024-05-05T05:05:05.050Z').getTime(),
        newer: new Date('2024-07-01T01:01:01.001Z').getTime(),
    };

    // 1. Only in origin
    await writeFileWithMtime(path.join(originRoot, 'Neon Mate/Fluorescent Heart/04 - Battery Kisses.mp3'),
        'we kiss like batteries\n',
        TS.mid);
    await writeFileWithMtime(path.join(originRoot, 'Citrus Reverbs/Pulp Signal/07 - Bitter Delay.mp3'),
        'pulp and hiss\n',
        TS.mid + 1234);

    // 2. Equal in both (same content + mtime)
    const equalPath = 'The Velvet Alpacas/Basement Demos/02 - Leftover Echoes.mp3';
    const equalContent = 'the room hums at 2am\n';
    await writeFileWithMtime(path.join(originRoot, equalPath), equalContent, TS.mid);
    await writeFileWithMtime(path.join(destinationRoot, equalPath), equalContent, TS.mid);

    // 3. Different content same filename (should copy)
    const diffPath = 'The Velvet Alpacas/Basement Demos/01 - Static Intro.mp3';
    await writeFileWithMtime(path.join(originRoot, diffPath), 'intro v2 from basement\n', TS.newer);
    await writeFileWithMtime(path.join(destinationRoot, diffPath), 'intro v1 radio edit\n', TS.older);

    // 4. Same content, different mtime (should copy due to mtime)
    const sameContentPath = 'Lavender Panic - Lo-Fi Lullaby.mp3';
    const sameContent = 'hiss and bloom\n';
    await writeFileWithMtime(path.join(originRoot, sameContentPath), sameContent, TS.newer);
    await writeFileWithMtime(path.join(destinationRoot, sameContentPath), sameContent, TS.older);

    // 5. Only in destination (should delete)
    await writeFileWithMtime(path.join(destinationRoot, 'Aquarium Ghosts/Tidepool Radio/11 - Saltwater TV.mp3'),
        'salt in the antenna\n',
        TS.older);
    await writeFileWithMtime(path.join(destinationRoot, 'Microwave Forest/Pine Needles/03 - Sap Dreams.mp3'),
        'sap drips slow-motion\n',
        TS.older + 222);

    // 6. Extra: many only-in-origin files to stress scrolling and progress
    if (count > 0) {
        console.log(`Adding ${count} extra files only in origin...`);
        const artists = ['Cardboard Satellites', 'Porcelain Wolves', 'Velvet Crickets', 'Neon Avalanche', 'Polaroid Moon', 'Cactus Choir', 'Sofa Astronomy'];
        const albums = ['Attic Recordings', 'Parking Lot Poems', 'Nocturne Cassette', 'Basement Echoes', 'Unfinished Demos', 'Static Flowers'];
        const nouns = ['Static', 'Dust', 'Soda', 'Lantern', 'Pollen', 'Quartz', 'Teacup', 'Matches', 'Velvet', 'Copper'];
        const verbs = ['Whispers', 'Glows', 'Cracks', 'Waltz', 'Repeats', 'Hums', 'Leans', 'Echoes'];

        await Promise.all(Array.from({ length: count }, async (_, i) => {
            const artist = pick(artists);
            const album = pick(albums);
            const track = `${pad3(i)} - ${pick(nouns)} ${pick(verbs)}.mp3`;
            const rel = path.join('Indie Dump', artist, album, track);
            const content = `lofi ${artist} ${album} #${i}\n` + 'x'.repeat(50 + (i % 200));
            await writeFileWithMtime(path.join(originRoot, rel), content, TS.mid + i * 1000);
        }));
    }

    // 7) Optional: extra only-in-destination files
    if (extraDest > 0) {
        console.log(`Adding ${extraDest} extra files only in destination...`);
        await Promise.all(Array.from({ length: extraDest }, async (_, i) => {
            const rel = path.join('Lost & Found', 'Abandoned Takes', `${pad3(i)} - Orphan ${i}.mp3`);
            await writeFileWithMtime(path.join(destinationRoot, rel), `orphan ${i}\n`, TS.older - i * 5000);
        }));
    }

    console.log('Fixtures created successfully.');
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

