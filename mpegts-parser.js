const fs = require('fs');

const PACKET_SIZE_BYTES = 188;
const PID_MASK = 0x1fff;
const PID_OFFSET_BYTES = 1;
const SYNC_BYTE = 0x47;

const uniquePIDs = new Set();

let numberOfPackets = 0;
let prevChunk;

process.stdin.on('data', (chunk) => {
  let startIndex = 0;

  if (prevChunk) {
    chunk = Buffer.concat([prevChunk, chunk]);
    prevChunk = undefined;
  }

  if (numberOfPackets === 0) {
    // Find the first sync byte in the chunk
    let isSyncByteFound = false;

    for (let j = 0; j < PACKET_SIZE_BYTES; j++) {
      const syncByte = chunk[j];
      const secondSyncByte = chunk[j + PACKET_SIZE_BYTES];

      if (syncByte === SYNC_BYTE && secondSyncByte === SYNC_BYTE) {
        isSyncByteFound = true;
        startIndex = j;
        break;
      }
    }

    if (!isSyncByteFound) {
      const offset = numberOfPackets * PACKET_SIZE_BYTES;

      console.error(
        `Error: No sync byte present in packet ${numberOfPackets}, offset ${offset}`
      );

      process.exit(1);
    }
  }

  // Parse the rest of the packets
  for (let i = startIndex; i < chunk.length; i += PACKET_SIZE_BYTES) {
    if (i + PACKET_SIZE_BYTES >= chunk.length) {
      if (numberOfPackets === 0) {
        console.error(
          `Error: The first packet is less than ${PACKET_SIZE_BYTES} bytes.`
        );
        process.exit(1);
      }

      prevChunk = chunk.subarray(i, chunk.length);
      break;
    }

    const packet = chunk.subarray(i, i + PACKET_SIZE_BYTES);
    const syncByte = packet[0];

    if (syncByte !== SYNC_BYTE) {
      const offset = numberOfPackets * PACKET_SIZE_BYTES;

      console.error(
        `Error: No sync byte present in packet ${numberOfPackets}, offset ${offset}`
      );

      process.exit(1);
    }

    const hexPID = packet.readUInt16BE(PID_OFFSET_BYTES) & PID_MASK;

    uniquePIDs.add(hexPID);

    numberOfPackets++;
  }
});

process.stdin.on('end', () => {
  Array.from(uniquePIDs)
    .sort((a, b) => a - b)
    .forEach((value) => {
      console.log(`0x${value.toString(16)}`);
    });

  process.exit(0);
});
