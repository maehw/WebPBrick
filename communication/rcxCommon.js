/*
 * WebPBrick
 * Copyright (C) 2024 maehw
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// This JavaScript code is used for serial communication with the RCX programmable brick - independent of the IR tower type.

const preamble = new Uint8Array([0x55, 0xFF, 0x00]); // all messages shall begin with those three bytes
const oddPrimes = new Uint8Array([1, 3, 5, 7, 11]); // magic number sequenced used once or twice
const unlockFirmwareMagic = new Uint8Array([0x4C, 0x45, 0x47, 0x4F, 0xAE]); // this is pretty much ASCII, feel free to look it up ;)

// RCX commands ("op codes") that are at least "directly" available (not just from program code).
const OpCode = {
    // Commands without parameters
	Ping:             0x10,
	MemMap:           0x20,
	PollBattery:      0x30,
	DeleteAllTasks:   0x40,
	StopAllTasks:     0x50,
	TurnOff:          0x60,
	DeleteAllSubs:    0x70,
	ClearSound:       0x80,
	ClearMsgBuf:      0x90,
	MuteSound:        0xD0,
	UnmuteSound:      0xE0,
    // Commands with a single parameter byte
	MotorOnOffFloat:  0x21,
	SetTxPower:       0x31,
	PlaySystemSound:  0x51,
	DeleteTask:       0x61,
    StartTask:        0x71,
    StopTask:         0x81,
    SelectProgram:    0x91,
    ClearTimer:       0xA1,
    SetPowerDownTime: 0xB1,
    DeleteSub:        0xC1,
    ClearSensorVal:   0xD1,
    SetMotorDir:      0xE1,
    // Commands with two parameter bytes
    PlayToneVar:      0x02,
    Poll:             0x12,
    SetWatch:         0x22,
    SetSensorType:    0x32,
    SetSensorMode:    0x42,
    SetDataLog:       0x52,
    DataLogNext:      0x62,
    // Commands with three parameter bytes
    DirectEvent:      0x03,
    SetPower:         0x13,
    PlayTone:         0x23,
    SelectDisplay:    0x33,
    UploadRam:        0x63,
    SetEvent:         0x93,
    SetMotorMaxPwr:   0xA3,
    // Commands with four parameter bytes
    SetVar:           0x14,
    SumVar:           0x24,
    SubVar:           0x34,
    DivVar:           0x44,
    MulVar:           0x54,
    SignVar:          0x64,
    AbsVar:           0x74,
    AndVar:           0x84,
    OrVar:            0x94,
    Upload:           0xA4,
    // Commands with five parameter bytes
    SetSourceValue:   0x05,
    GetFwVersion:     0x15, // "UnlockPBrick"
    BeginOfTask:      0x25,
    BeginOfSub:       0x35,
    GoIntoBootMode:   0x65,
    BeginFwDownload:  0x75,
    UnlockFirmware:   0xA5,
    ViewSourceVal:    0xE5,
    // Exceptions where the number of parameters does not match the lower nibble of the opcode;
    // they need special handling, when they are used.
	//ClearAllEvents:   0x06,
    //MotorConDiscon:   0x67,
    //SetNormSetInvAltDir: 0x77,
    //IncCounter:       0x97,
    //DecCounter:       0xA7,
    //ClearCounter:     0xB7,
    //SetPriority:      0xD7,
    //CalibrateEvt:     0x04
    ContinueDownload: 0x45,
    // Other exceptions
    //SendUartData:     0xC2, // no reply!
    //RemoteCommand:    0xD2, // no reply!
}

// List of RCX system sounds
const SystemSound = {
	KeyClick:    0,
	Beep:        1,
	SweepUp:     2,
	SweepDown:   3,
	Error:       4,
	FastSweepUp: 5
}

// List of download statuses
const DownloadStatus = {
	Okay:               0,
	NotEnoughMemory:    1,
	IllegalNumber:      2,
	BlockChecksumError: 3,
	FwChecksumError:    4,
	DownloadNotActive:  6
}

// Logging helper functions
function showErrorMsg(msg) {
    log.value += "❌️ " + msg + "\n";
}

function showInfoMsg(msg) {
    log.value += msg + "\n";
}

function showDebugMsg(msg) {
    log.value += "🕵🏻‍ " + msg + "\n";
}

// Helper to convert two bytes (8 bit each) to a single 16-bit word
function to16bit(payload, highLow) {
    if(payload.constructor != Uint8Array) {
        return null;
    }

    // Byte order: check if first byte shall be the low or the high byte
    if(highLow) {
        return ((payload[0] & 0xFF) << 8) | (payload[1] & 0xFF);
    }
    else {
        return ((payload[1] & 0xFF) << 8) | (payload[0] & 0xFF);
    }
}

// Helper to get the lower byte form a 16-bit word
function getLoByte(value) {
    return (value & 0xFF);
}

// Helper to get the higher byte form a 16-bit word
function getHiByte(value) {
    return ((value >> 8) & 0xFF);
}

// Concatenate two buffers
function concatBuffers(buf1, buf2) {
    var tmpBuf = new Uint8Array(buf1.byteLength + buf2.byteLength);
    tmpBuf.set(new Uint8Array(buf1), 0);
    tmpBuf.set(new Uint8Array(buf2), buf1.byteLength);
    return tmpBuf;
}

// Helper to convert an array to hexadecimal representation
function array2hex(arrayBuffer) {
    if(arrayBuffer.length == 0) {
        return ""
    }
    else {
        return "0x"+Array.from(new Uint8Array(arrayBuffer))
            .map(n => n.toString(16).toUpperCase().padStart(2, "0"))
            .join(" 0x");
    }
}

/**
  * Returns a Uint8Array() message ready for transmission.
  * The toggle bit is toggled after every function call.
  */
function encodeCommand(opcode, params) {
    const emptyMsg = new Uint8Array();
    let txOpcode = opcode; // copy opcode, optionally set toggle bit later

    // TODO: this is a workaround to have something like 'static' in C, there may be a better way
    // This is making use of a function just being an object in JavaScript.
    if ( typeof encodeCommand.toggleBit == 'undefined' ) {
        encodeCommand.toggleBit = false; // initialize to false
    }

    // check lower nibble of opcode to match number of parameters ...
    // except when the download command is used because there's a variable length of parameter bytes
    // (see also the list of OpCodes from above)
    const paramLen = opcode & 0x07;
    if((paramLen != params.length) && (OpCode.ContinueDownload != opcode)) {
        console.log("Wrong number of parameters!");
        // wrong number of parameters
        return emptyMsg;
    }

    // two more bytes for opcode and its implement, two more bytes for checksum and its complement
    let cmdMsg = new Uint8Array(preamble.length + 2 + params.length*2 + 2);

    // fill with preamble
    cmdMsg.set(preamble, 0);

    // set toggle bit every second time
    txOpcode |= (encodeCommand.toggleBit << 3);
    console.log("[OPT] " + array2hex(new Uint8Array([txOpcode])) +
                       " (original: " + array2hex(new Uint8Array([opcode])) + ")");
    // toggle the toggle bit for the next op
    encodeCommand.toggleBit = !encodeCommand.toggleBit;

    // fill with opcode and its complement
    cmdMsg.set([txOpcode, ~txOpcode], preamble.length);

    // fill parameter bytes and calculate checksum for the current command while doing so
    let checksum = txOpcode;
    for(let i = 0; i<params.length; i++) {
        checksum += params[i];

        cmdMsg.set([params[i], ~params[i]], preamble.length + 2 + 2*i);
    }
    checksum %= 256;

    // set the checksum and its complement as parts of the message
    cmdMsg.set([checksum, ~checksum], cmdMsg.length - 2);

    return cmdMsg;
}

/**
 * Calculate RCX firmware's checksum
 */
function calculateFirmwareChecksum(firmwareData) {
    const firmwareSize = firmwareData.length;

    if(firmwareSize > 19*1024) {
        showInfoMsg("Firmware size exceeds 19 kBytes. Limited checksum calculation to first 19 kBytes.");
    }

    // "The firmware check sum is the sum of the first 19456 bytes in the firmware program (= 19 * 1024 = 19K) modulo 65536."
    // Note: 19456 (decimal) = 0x4C00; 65536 = 2^16
    let fwChecksum = 0;
    for(let i = 0; i < Math.min(firmwareSize, 19456); i++) {
        fwChecksum += firmwareData[i];
    }
    fwChecksum %= 65536;

    return fwChecksum;
}

// Send command to send RCX into boot mode
async function goIntoBootMode() {
    let {success, payload} = await transceiveCommand(OpCode.GoIntoBootMode, oddPrimes);
    return success;
}

// Send command to unlock RCX' firmware
async function unlockFirmware() {
    let {success, payload} = await transceiveCommand(OpCode.UnlockFirmware, unlockFirmwareMagic);
    return success;
}

// Download firmware to RCX programmable brick
async function downloadFirmware() {
    // TODO: add mechanism to choose between different firmware versions
    let firmwareData = firm0328Data; // official LEGO firmware
    //let firmwareData = firmOhmmeterData; // 3rd-party firmware

    // prepare download
    const firmwareSize = firmwareData.length;
    showInfoMsg("🧮 Firmware size in bytes: " + firmwareSize);

    const firmwareChecksum = calculateFirmwareChecksum(firmwareData);
    showInfoMsg("🧮 Calculated firmware checksum: 0x" + firmwareChecksum.toString(16).padStart(4, '0').toUpperCase());

    // ping
    let success = await goIntoBootMode(); // ignore result, maybe echo reply is cut off?!
    if(!success) {
        showErrorMsg("Unable to enter boot mode. Please retry!");
    }

    if(success) {
        showInfoMsg("🥾 Entered boot mode.");

        success = await beginFirmwareDownload(firmwareChecksum);

        if(!success) {
            showErrorMsg("Unable to begin firmware download.");
        }
    }

    if(success) {
        showInfoMsg("🐌 Began firmware download...");

        // continue download in blocks of N bytes
        const blockSize = 20;
        const extendedTimeout = false; // timeout depends on block size (data transfer duration)
        //const blockSize = 200; // TODO: make it work with bigger block sizes
        //const extendedTimeout = true; // timeout depends on block size (data transfer duration)
        const numBlocks = Math.ceil(firmwareSize/blockSize);
        console.log("Calculated " + numBlocks + " blocks to download.");
        showInfoMsg("🧱 Calculated " + numBlocks + " firmware blocks to download.");
        let downloadSuccess = true;
        let downloadedBlock = false;
        for(let blockCount = 1; blockCount <= numBlocks; blockCount++) {
            let blockData = firmwareData.slice((blockCount-1)*blockSize, blockCount*blockSize);
            downloadedBlock = await downloadBlock(blockCount, blockData, extendedTimeout);
            if(!downloadedBlock) {
                console.log("Download error during block #" + blockCount + ", retrying...");
                showErrorMsg("Download error during block #" + blockCount + ", retrying...");

                // maybe, we have to wake something up again!
                let success = await wakeup();
                if(!success) {
                    showErrorMsg("No communication with RCX possible.\n" +
                                 "RCX needs to be switched on and placed close to the IR tower.");
                    downloadSuccess = false;
                    break;
                }

                let retry = 0;
                const maxRetries = 5;
                for(retry = 1; retry <= maxRetries; retry++) {
                    await sleep(300); // wait for short duration before retry (transmission conditions may improve!)
                    downloadedBlock = await downloadBlock(blockCount, blockData, extendedTimeout);
                    if(downloadedBlock) {
                        const progress = blockCount/numBlocks;
                        showInfoMsg("⏳ Successfully downloaded firmware block " + blockCount + "/" + numBlocks +
                                    " ("+ Math.round(progress*1000)/10 + " %)");

                        break; // no need to retry any longer
                    }
                    else {
                        const retryText = "Download error during retry attempt #" + retry +
                                          " of block #" + blockCount + "...";
                        console.log(retryText);
                        showErrorMsg(retryText);
                    }
                }
                if(!downloadedBlock) {
                    console.log("Aborting download.");
                    downloadSuccess = false;
                    break;
                }
            }
            else {
                const progress = blockCount/numBlocks;
                showInfoMsg("⏳ Successfully downloaded firmware block " + blockCount + "/" + numBlocks +
                            " ("+ Math.round(progress*1000)/10 + " %)");
            }
        }
        // in contrast to program task download it does not look like there was a block #0 at the end

        success = downloadSuccess;
    }

    if(success) {
        showInfoMsg("⌛️ Finalizing firmware...");

        success = await unlockFirmware();
        if(!success) {
            showErrorMsg("May have failed to unlock firmware.");
        }
    }

    return success;
}

// Send command to RCX that indicates beginning of a firmware download
async function beginFirmwareDownload(checksum) {
    const startAddress = 0x8000; // always this same memory start address
    const {success, payload} = await transceiveCommand(OpCode.BeginFwDownload,
                                                       [getLoByte(startAddress),
                                                        getHiByte(startAddress),
                                                        getLoByte(checksum),
                                                        getHiByte(checksum),
                                                        0]);

    if(success) {
        if((payload.length != 2) || (payload[1] != DownloadStatus.Okay)) {
            success = false;
        }
    }

    return success;
}

// Download user program to RCX programmable brick
async function downloadProgram(programNumber, rcxBinary) {
    showInfoMsg("🛠️ Parsing program binary using kaitai...");

    let success = (rcxBinary !== null);
    let parsedRcxi = null;

    if(success) {
        parsedRcxi = new LegoRcx(new KaitaiStream(rcxBinary));
        if(parsedRcxi.chunks.length != parsedRcxi.chunkCount) {
            success = false;
        }
    }
    if(!success) {
        showErrorMsg("Unable to parse program binary.");
    }

    if(success) {
        showInfoMsg("🛠️ Preparing program download...");

        success = await selectProgram(programNumber);

        if(!success) {
            showErrorMsg("Failed to select program #" + programNumber + ".");
        }
    }

    if(success) {
        showInfoMsg("🔢 Selected program number #" + programNumber + ".");

        success = await stopRunningTasks();
        if(!success) {
            showErrorMsg("Unable to stop running tasks.");
        }
    }

    if(success) {
        showInfoMsg("🧍 Stopped running tasks.");

        success = await deleteTasks();
        if(!success) {
            showErrorMsg("Unable to delete old tasks.");
        }
    }

    if(success) {
        showInfoMsg("🗑️ Successfully deleted old tasks.");

        success = await deleteSubroutines();
        if(!success) {
            showErrorMsg("Unable to delete old subroutines.");
        }
    }

    if(success) {
        showInfoMsg("🗑️ Successfully deleted old subroutines.");

        let taskNumber = 0;
        let subtaskNumber = 0;

        showInfoMsg("🐌 Downloading new program...");

        if(parsedRcxi.chunks.length == parsedRcxi.chunkCount) {
            const numChunks = parsedRcxi.chunkCount;
            showDebugMsg("Found " + numChunks + " chunk(s) in RCX image file.");
            for(let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
                if(parsedRcxi.chunks[chunkIdx].chunkLength  == parsedRcxi.chunks[chunkIdx].chunkData.length) {
                    const chunkLength = parsedRcxi.chunks[chunkIdx].chunkLength;
                    const chunkType = parsedRcxi.chunks[chunkIdx].chunkType;
                    const chunkData = parsedRcxi.chunks[chunkIdx].chunkData;
                    if(0 == chunkType) {
                        showDebugMsg("Chunk #" + chunkIdx + " is a task (#" + taskNumber + ") and " + chunkLength + " bytes long.");

                        success = await downloadTask(taskNumber, chunkData);
                        if(success) {
                            showInfoMsg("⏳ Successfully downloaded task (#" + taskNumber + ").");
                        }
                        else {
                            showErrorMsg("Failed to download new task.");
                        }
                        taskNumber++;
                    }
                    else {
                        showErrorMsg("Unsupported chunk type #" + chunkType + ". Kindly ask developers to add support.");
                        debugger;
                    }
                }

                if(!success) {
                    break;
                }
            }
        }
    }

    return success;
}

/**
  * On error returns received message without payload, but with complement bytes for further analysis
  */
function extractReply(rxMsg) {
    // throw away the preamble at the beginning as it does not contain any info (remove more redundancy)
    rxMsg = rxMsg.slice(preamble.length);

    if(rxMsg.length < 2) {
        // expect at least 2 bytes for the checksum
        console.log("[XTR] message too short: " + rxMsg.length);
        return {valid: false, payload: rxMsg};
    }

    if(rxMsg.length % 2 != 0) {
        // expect multiple of 2 bytes
        console.log("[XTR] remaining length w/o preamble not a multiple of 2: " + rxMsg.length);
        return {valid: false, payload: rxMsg};
    }

    // verify checksum and check complements
    let checksum = 0;
    for(let i=0; i<rxMsg.length - 2; i += 2) {
        checksum += rxMsg[i];

        if((rxMsg[i] ^ rxMsg[i+1]) != 0xFF) {
            return {valid: false, payload: rxMsg};
        }
    }
    checksum %= 256;

    // check if received checksum's complement is OK
    if((rxMsg[rxMsg.length - 2] ^ rxMsg[rxMsg.length - 1]) != 0xFF) {
        return {valid: false, payload: rxMsg};
    }

    // check if received checksum matches calculated checksum
    if(rxMsg[rxMsg.length - 2] != checksum) {
        return {valid: false, payload: rxMsg};
    }

    // take every other (non-complement) byte, also throw away checksum (as it has been checked previously)
    let replyPayload = rxMsg.filter(function(value, index, Arr) {
        return (index % 2 == 0) && (index < (Arr.length - 2));
    });

    return {valid: true, payload: replyPayload};
}

async function downloadTask(taskNumber, taskData) {
    // prepare download
    const taskSize = taskData.length;
    const beganTaskDownload = await beginTaskDownload(taskNumber, 0, taskSize);
    if(!beganTaskDownload) {
        console.log("Unable to begin task download for task #" + taskNumber);
        return false;
    }

    // continue download in blocks of 20 bytes
    const blockSize = 20;
    const extendedTimeout = false; // timeout depends on block size (data transfer duration)
    const numBlocks = Math.ceil(taskSize/blockSize);
    console.log("Calculated " + numBlocks + " blocks to download.");
    let downloadSuccess = true;
    let downloadedBlock = false;
    for(let blockCount = 1; blockCount < numBlocks; blockCount++) {
        let blockData = taskData.slice((blockCount-1)*blockSize, blockCount*blockSize);
        downloadedBlock = await downloadBlock(blockCount, blockData, extendedTimeout);
        if(!downloadedBlock) {
            downloadSuccess = false;
            console.log("Download error during block #" + blockCount);
            break;
        }
    }

    // still lucky, let's try the last remaining block until completion
    if(downloadSuccess) {
        // remaining data is in block 0
        let blockData = taskData.slice((numBlocks-1)*blockSize);
        downloadedBlock = await downloadBlock(0, blockData);
        if(!downloadedBlock) {
            downloadSuccess = false;
            console.log("Download error during last block.");
        }
    }

    return downloadSuccess;
}

async function downloadBlock(blockCount, blockData, extendedTimeout = false) {
    const blockSize = blockData.length;
    const blockParamHeader = new Uint8Array([getLoByte(blockCount),
                                             getHiByte(blockCount),
                                             getLoByte(blockSize),
                                             getHiByte(blockSize)]);
    let blockChecksum = 0;
    for(let i = 0; i < blockSize; i++) {
        blockChecksum += blockData[i];
    }
    blockChecksum %= 256;
    const params = concatBuffers(concatBuffers(blockParamHeader, blockData), new Uint8Array([blockChecksum]));
    let timeout = 300;
    if(extendedTimeout) {
        timeout = 1800;
        console.log("Extended timeout to " + timeout);
    }
    let {success, payload} = await transceiveCommand(OpCode.ContinueDownload, params);

    if(success) {
        switch (payload[1]) {
            case DownloadStatus.Okay:
                console.log("Successfully downloaded block #" + blockCount + ".");
                break;
            case DownloadStatus.BlockChecksumError:
                success = false;
                console.log('Block checksum error in block #' + blockCount);
                break;
            case DownloadStatus.FwChecksumError:
                success = false;
                console.log('Firmware checksum error in block #' + blockCount);
                break;
            case DownloadStatus.DownloadNotActive:
                success = false;
                console.log('Error in block #' + blockCount + ': download not active!');
                break;
            default:
                success = false;
                console.log('Unexpected error: ' + array2hex([payload[1]]));
        }
    }

    return success;
}

async function playTone(frequency, duration) {
    if(duration < 0 || duration > 255) {
        // parameter error
        return false;
    }

    // duration inside the RCX is a multiple of 1/100 seconds, i.e. multiple of 10 milliseconds
    let {success, payload} = await transceiveCommand(OpCode.PlayTone,
                                                     [getLoByte(frequency),
                                                      getHiByte(frequency),
                                                      getLoByte(duration),
                                                     ]);

    return success;
}

async function getVersions() {
    let {success, payload} = await transceiveCommand(OpCode.GetFwVersion, oddPrimes);
    let romVersion = "unknown";
    let fwVersion = "unknown";

    if(success && (payload.length == 9)) {
        console.log("Retrieved RCX firmware versions.");

        // RAM version seems to be BCD encoded:
        // "0x00 0x03 0x03 0x02" matches RCX firmware version "3.32"
        const romMajor = parseInt(payload.slice(1, 1+2).join('')); // remove leading zeros
        const romMinor = parseInt(payload.slice(3, 3+2).join(''));
        romVersion = romMajor + "." + romMinor;
        const ramMajor = parseInt(payload.slice(5, 5+2).join('')); // remove leading zeros
        const ramMinor = parseInt(payload.slice(7, 7+2).join(''));
        fwVersion = ramMajor + "." + ramMinor;
    }
    else {
        console.log("Unable to read RCX firmware versions.");
    }

    return {success: success, romVersion: romVersion, fwVersion: fwVersion};
}

async function playSystemSound(sound) {
    return await transceiveCommand(OpCode.PlaySystemSound, [sound]);
}

async function ping(playSound = false) {
    let {success, payload} = await transceiveCommand(OpCode.Ping);

    if(success) {
        console.log("Programmable brick is alive.");
        if(playSound) {
            await playSystemSound(SystemSound.FastSweepUp);
        }
    }
    else {
        console.log("Programmable brick is not alive.");
        if(playSound) {
            await playSystemSound(SystemSound.Error);
        }
    }

    return success;
}

async function wakeup() {
    let {success, payload} = await transceiveCommand(OpCode.Ping, [], 500, true);
    return success;
}

async function getBatteryLevel() {
    const {success, payload} = await transceiveCommand(OpCode.PollBattery);
    let level = 0;

    if(success && (payload.length == 3)) {
        // convert from two bytes to percentage, assume values in range 0..100
        level = to16bit(payload.slice(1), false) / 100;
        console.log("Raw battery level:", array2hex(payload.slice(1)));
    }
    else {
        console.log("Unable to read battery level.");
    }

    return level;
}

async function selectProgram(programNumber) {
    if(programNumber < 0 || programNumber > 5) {
        // parameter error: out of valid range
        return false;
    }
    const {success, payload} = await transceiveCommand(OpCode.SelectProgram, [programNumber]);

    if(success) {
        console.log("Selected program #" + programNumber + ".");
    }
    else {
        console.log("Unable to select program #" + programNumber + ".");
    }

    return success;
}

async function stopRunningTasks() {
    const {success, payload} = await transceiveCommand(OpCode.StopAllTasks);

    if(success) {
        console.log("Stopped running tasks in the currently selected program and released acquired access resources.");
    }
    else {
        console.log("Unable to stop running tasks in the currently selected program.");
    }

    return success;
}

async function deleteTasks() {
    const {success, payload} = await transceiveCommand(OpCode.DeleteAllTasks);

    if(success) {
        console.log("Deleted all tasks in the currently selected program.");
    }
    else {
        console.log("Unable to delete all tasks in the currently selected program.");
    }

    return success;
}

async function deleteSubroutines() {
    const {success, payload} = await transceiveCommand(OpCode.DeleteAllSubs);

    if(success) {
        console.log("Deleted all subroutines in the currently selected program.");
    }
    else {
        console.log("Unable to delete all subroutines in the currently selected program.");
    }

    return success;
}

async function beginTaskDownload(taskNumber, subCallList, taskSize) {
    const {success, payload} = await transceiveCommand(OpCode.BeginOfTask,
                                                       [0,
                                                       getLoByte(taskNumber),
                                                       getLoByte(subCallList),
                                                       getLoByte(taskSize),
                                                       getHiByte(taskSize)
                                                       ]);

    if(success) {
        switch (payload[1]) {
            case DownloadStatus.Okay:
                console.log("Beginning task download...");
                break;
            case DownloadStatus.NotEnoughMemory:
                success = false;
                console.log('Not enough memory.');
                break;
            case DownloadStatus.IllegalNumber:
                success = false;
                console.log('Illegal task number.');
                break;
            default:
                success = false;
                console.log('Unexpected error: ' + array2hex([payload[1]]));
        }
    }
    else {
        console.log("Unable to begin task download.");
    }

    return success;
}
