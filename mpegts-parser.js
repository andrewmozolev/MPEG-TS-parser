const fs = require('fs');

const PACKET_SIZE_BYTES = 188;
const PID_MASK = 0x1fff;
const PID_OFFSET_BYTES = 1;
const SYNC_BYTE = 0x47;

const uniquePIDs = new Set();

let numberOfPackets = 0;
let offset = 0;
let prevChunk;

process.stdin.on('data', (chunk) => {
  if (prevChunk) {
    chunk = Buffer.concat([prevChunk, chunk]);
  }

  for (let i = 0; i < chunk.length; i += PACKET_SIZE_BYTES) {
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
      console.error(
        `Error: No sync byte present in packet ${numberOfPackets}, offset ${offset}`
      );

      process.exit(1);
    }

    const hexPID = packet.readUInt16BE(PID_OFFSET_BYTES) & PID_MASK;

    uniquePIDs.add(hexPID);

    numberOfPackets++;
    offset += PACKET_SIZE_BYTES;
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