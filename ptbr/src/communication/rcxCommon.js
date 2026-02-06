/*
 * WebPBrick
 * Copyright (C) 2024-2026 maehw
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
    RemoteCommand:    0xD2, // no reply!
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
    if((paramLen != params.length) && (OpCode.ContinueDownload != opcode) && (OpCode.RemoteCommand != opcode)) {
        console.log("Número errado de paramêtros!");
        // wrong number of parameters
        return emptyMsg;
    }

    // two more bytes for opcode and its complement, two more bytes for checksum and its complement
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
    if(params.length > 0) {
      console.log("[PRMS] " + array2hex(new Uint8Array(params)));
    }
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
        showInfoMsg("Tamanho do Firmware excede 19 kBytes. Limitada a soma de verificação (checksum) aos primeiros 19 kBytes.");
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
    console.log("Entrando no modo de boot.");
    let {success, payload} = await transceiveCommand(OpCode.GoIntoBootMode, oddPrimes);
    return success;
}

// Send command to unlock RCX' firmware
async function unlockFirmware() {
    // ignoring the reply as unlock usually works even though the command reply is not verified correctly
    let {success, payload} = await transceiveCommand(OpCode.UnlockFirmware, unlockFirmwareMagic, 1500, true);
    return success;
}

function capitalize(s)
{
    return String(s[0]).toUpperCase() + String(s).slice(1);
}

// Download firmware to RCX programmable brick
async function downloadFirmware(description="firmware", firmwareData=[]) {
    // prepare download
    const firmwareSize = firmwareData.length;
    showInfoMsg("🧮 " + capitalize(description) + " tamanho em bytes: " + firmwareSize);

    const firmwareChecksum = calculateFirmwareChecksum(firmwareData);
    showInfoMsg("🧮 Calculado " + description + " checksum: 0x" + firmwareChecksum.toString(16).padStart(4, '0').toUpperCase());

    let success = false;
    let numPings = 0;
    while(!success && (numPings < 3)) {
      success = await ping();
      numPings++;
    }

    if(success) {
        success = await goIntoBootMode();
        if(!success) {
            showErrorMsg("Não foi possível entrar no modo de boot na primeira tentativa. Tentando novamente...");

            let success = await goIntoBootMode();
            if(!success) {
                showErrorMsg("Não foi possível entrar no modo de boot.");
            }
        }
    } else {
        showErrorMsg("Não foi possível se comunicar com o bloco RCX.\n" +
                     "O bloco RCX precisa estar ligado e colocado perto da torre infravermelho, como também em seu alcance.\n" +
                     "Por favor, tente novamente.");
    }

    if(success) {
        showInfoMsg("🥾 Modo de boot carregado.");

        success = await beginFirmwareDownload(firmwareChecksum);

        if(!success) {
            showErrorMsg("Não foi possível iniciar o download do " + description + ".");
        }
    }

    if(success) {
        showInfoMsg("🐌 Inciado " + description + " download...");

        // continue download in blocks of N bytes
        const blockSize = 20;
        const extendedTimeout = false; // timeout depends on block size (data transfer duration)
        //const blockSize = 200; // TODO: make it work with bigger block sizes
        //const extendedTimeout = true; // timeout depends on block size (data transfer duration)
        const numBlocks = Math.ceil(firmwareSize/blockSize);
        console.log("Calculado " + numBlocks + " blocos para download.");
        showInfoMsg("🧱 Calculado " + numBlocks + " " + description + " blocos para download.");
        let downloadSuccess = true;
        let downloadedBlock = false;

        startDownloadTime = performance.timeOrigin + performance.now();

        for(let blockCount = 1; blockCount <= numBlocks; blockCount++) {
            let blockData = firmwareData.slice((blockCount-1)*blockSize, blockCount*blockSize);
            downloadedBlock = await downloadBlock(blockCount, blockData, extendedTimeout);
            if(!downloadedBlock) {
                console.log("Erro no download durante o bloco #" + blockCount + ", tentando novamente...");
                showErrorMsg("Erro no download durante o bloco #" + blockCount + ", tentando novamente...");

                // maybe, we have to wake something up again!
                let success = await wakeup();
                if(!success) {
                    showErrorMsg("Não foi possível se comunicar com o bloco RCX.\n" +
                                 "O bloco RCX precisa ser ligado e colocado perto da torre infravermelho.");
                    downloadSuccess = false;
                    break;
                }

                let retry = 0;
                const maxRetries = 10;
                for(retry = 1; retry <= maxRetries; retry++) {
                    await sleep(retry * 100); // wait for short duration before retry (transmission conditions may improve!)
                    downloadedBlock = await downloadBlock(blockCount, blockData, extendedTimeout);
                    if(downloadedBlock) {
                        const progress = blockCount/numBlocks;
                        showInfoMsg("⏳ [" + (duration/1000).toFixed(1) + "s] baixados com sucesso " +
                                    description + " bloco " + blockCount + "/" + numBlocks +
                                    " ("+ Math.round(progress*1000)/10 + " %)");

                        break; // no need to retry any longer
                    }
                    else {
                        const retryText = "Erro de download durante a tentativa de reenvio #" + retry +
                                          " do bloco #" + blockCount + "...";
                        console.log(retryText);
                        showErrorMsg(retryText);
                    }
                }
                if(!downloadedBlock) {
                    console.log("Abortando download.");
                    downloadSuccess = false;
                    break;
                }
            } else {
                const progress = blockCount/numBlocks;
                const currentTime = performance.timeOrigin + performance.now();
                const duration = currentTime - startDownloadTime;
                showInfoMsg("⏳ [" + (duration/1000).toFixed(1) + "s] baixados com sucesso " +
                            description + " bloco " + blockCount + "/" + numBlocks +
                            " ("+ Math.round(progress*1000)/10 + " %)");
            }
        }
        // in contrast to program task download it does not look like there was a block #0 at the end

        success = downloadSuccess;
    }

    if(success) {
        showInfoMsg("⌛️ Finalizando " + description + " download...");

        success = await unlockFirmware();
        if(!success) {
            showErrorMsg("Talvez tenha falhado ao destravar " + description + ".");
        }
    }

    return success;
}

// Send command to RCX that indicates beginning of a firmware download
async function beginFirmwareDownload(checksum) {
    const startAddress = 0x8000; // always this same memory start address
    let {success, payload} = await transceiveCommand(OpCode.BeginFwDownload,
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
    showInfoMsg("🛠️ Processando binário do programa utilizando kaitai...");

    let success = (rcxBinary !== null);
    let parsedRcxi = null;

    if(success) {
        parsedRcxi = new LegoRcx(new KaitaiStream(rcxBinary));
        if(parsedRcxi.chunks.length != parsedRcxi.chunkCount) {
            success = false;
        }
    }
    if(!success) {
        showErrorMsg("Não foi possível processar o binário do programa.");
    }

    if(success) {
        showInfoMsg("🛠️ Preparando o download do programa #" + programNumber);

        success = await selectProgram(programNumber);

        if(!success) {
            showErrorMsg("Falha ao selecionar o programa #" + programNumber + ".");
        }
    }

    if(success) {
        showInfoMsg("🔢 Selecionado o programa de número #" + programNumber + ".");

        success = await stopRunningTasks();
        if(!success) {
            showErrorMsg("Não foi possível parar as tarefas em execução.");
        }
    }

    if(success) {
        showInfoMsg("🧍 Para todas as tarefas em execução.");

        success = await deleteTasks();
        if(!success) {
            showErrorMsg("Não foi possível deletar tarefas antigas.");
        }
    }

    if(success) {
        showInfoMsg("🗑️ Tarefas antigas deletadas com sucesso.");

        success = await deleteSubroutines();
        if(!success) {
            showErrorMsg("Não foi possível deletar subrotinas antigas.");
        }
    }

    if(success) {
        showInfoMsg("🗑️ Subrotinas deletadas com sucesso.");

        let taskNumber = 0;
        let subtaskNumber = 0;

        showInfoMsg("🐌 Baixando novo programa...");

        if(parsedRcxi.chunks.length == parsedRcxi.chunkCount) {
            const numChunks = parsedRcxi.chunkCount;
            showDebugMsg("Achados " + numChunks + " pedaços na imagem do bloco RCX.");
            for(let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
                if(parsedRcxi.chunks[chunkIdx].chunkLength  == parsedRcxi.chunks[chunkIdx].chunkData.length) {
                    const chunkLength = parsedRcxi.chunks[chunkIdx].chunkLength;
                    const chunkType = parsedRcxi.chunks[chunkIdx].chunkType;
                    const chunkData = parsedRcxi.chunks[chunkIdx].chunkData;
                    if(0 == chunkType) {
                        showDebugMsg("Pedaço #" + chunkIdx + " é uma tarefa (#" + taskNumber + ") e com tamanho de " + chunkLength + " bytes.");

                        success = await downloadTask(taskNumber, chunkData);
                        if(success) {
                            showInfoMsg("⏳ Tarefa baixada com sucesso (#" + taskNumber + ").");
                        }
                        else {
                            showErrorMsg("Falha ao baixar nova tarefa.");
                        }
                        taskNumber++;
                    }
                    else {
                        showErrorMsg("Tipo de pedaço (chunk) não suportado #" + chunkType + ". Peça encarecidamente aos desenvolvedores para adicionar suporte.");
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
function extractReply(rxMsg, quiet=false) {
    // throw away the preamble at the beginning as it does not contain any info (remove more redundancy)
    rxMsg = rxMsg.slice(preamble.length);

    if(rxMsg.length < 2) {
        // expect at least 2 bytes for the checksum
        if(!quiet) {
            console.log("[XTR] mensagem muito curta: " + rxMsg.length);
        }
        return {valid: false, payload: rxMsg};
    }

    if(rxMsg.length % 2 != 0) {
        // expect multiple of 2 bytes
        if(!quiet) {
            console.log("[XTR] O comprimento restante sem o preâmbulo não é um múltiplo de 2: " + rxMsg.length);
        }
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
        console.log("Não foi possível iniciar o download da tarefa #" + taskNumber);
        return false;
    }

    // continue download in blocks of 20 bytes
    const blockSize = 20;
    const extendedTimeout = false; // timeout depends on block size (data transfer duration)
    const numBlocks = Math.ceil(taskSize/blockSize);
    console.log("Calculados " + numBlocks + " blocos para baixar.");
    let downloadSuccess = true;
    let downloadedBlock = false;
    for(let blockCount = 1; blockCount < numBlocks; blockCount++) {
        let blockData = taskData.slice((blockCount-1)*blockSize, blockCount*blockSize);
        downloadedBlock = await downloadBlock(blockCount, blockData, extendedTimeout);
        if(!downloadedBlock) {
            downloadSuccess = false;
            console.log("Erro de download durante o bloco #" + blockCount);
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
            console.log("Erro de download durante o último bloco.");
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
        console.log("aumentar intervalo para " + timeout);
    }
    let {success, payload} = await transceiveCommand(OpCode.ContinueDownload, params);

    if(success) {
        switch (payload[1]) {
            case DownloadStatus.Okay:
                console.log("Baixado com sucesso o bloco #" + blockCount + ".");
                break;
            case DownloadStatus.BlockChecksumError:
                success = false;
                console.log('Erro de soma de verificação (checksum) no bloco #' + blockCount);
                break;
            case DownloadStatus.FwChecksumError:
                success = false;
                console.log('Erro de soma de verificação (checksum) do firmware no bloco #' + blockCount);
                break;
            case DownloadStatus.DownloadNotActive:
                success = false;
                console.log('Erro no bloco #' + blockCount + ': download não ativo!');
                break;
            default:
                success = false;
                console.log('Erro inesperado: ' + array2hex([payload[1]]));
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
        console.log("Recuperada as versões do firmware do bloco RCX.");

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
        console.log("Não foi possível ler as versões do firmware do bloco RCX.");
    }

    return {success: success, romVersion: romVersion, fwVersion: fwVersion};
}

async function playSystemSound(sound) {
    return await transceiveCommand(OpCode.PlaySystemSound, [sound]);
}

async function ping(playSound = false) {
    console.log("Ping...");
    let {success, payload} = await transceiveCommand(OpCode.Ping);

    if(success) {
        console.log("O bloco prográmavel está respondendo.");
        if(playSound) {
            await playSystemSound(SystemSound.FastSweepUp);
        }
    }
    else {
        console.log("O bloco prográmavel não está respondendo.");
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
        console.log("Nível cru da bateria:", array2hex(payload.slice(1)));
    }
    else {
        console.log("Não foi possível ler o nível da bateria.");
    }

    return level;
}

async function selectProgram(programNumber) {
    if(programNumber < 1 || programNumber > 5) {
        // parameter error: out of valid range
        return false;
    }
    const {success, payload} = await transceiveCommand(OpCode.SelectProgram, [programNumber - 1]);

    if(success) {
        console.log("Programa selecionado #" + programNumber + ".");
    } else {
        console.log("Não foi possível selecionar o programa #" + programNumber + ".");
    }

    return success;
}

async function stopRunningTasks() {
    const {success, payload} = await transceiveCommand(OpCode.StopAllTasks);

    if(success) {
        console.log("Parada as tarefas em execução no programa atual e liberou os recursos de acesso adquiridos.");
    } else {
        console.log("Não foi possível parar as tarefas em execução no programa atual.");
    }

    return success;
}

async function deleteTasks() {
    const {success, payload} = await transceiveCommand(OpCode.DeleteAllTasks);

    if(success) {
        console.log("Deletada todas as tarefas no programa atualmente selecionado.");
    }
    else {
        console.log("Não foi possível deletar todas as tarefas no programa atualmente selecionado.");
    }

    return success;
}

async function deleteSubroutines() {
    const {success, payload} = await transceiveCommand(OpCode.DeleteAllSubs);

    if(success) {
        console.log("Deletadas todas as subrotinas no programa atualmente selecionado.");
    }
    else {
        console.log("Não foi possível deletar todas as subrotinas no programa atualmente selecionado.");
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
                console.log("Iniciando o download da tarefa...");
                break;
            case DownloadStatus.NotEnoughMemory:
                success = false;
                console.log('Memória insuficiente.');
                break;
            case DownloadStatus.IllegalNumber:
                success = false;
                console.log('Número de tarefa inválido.');
                break;
            default:
                success = false;
                console.log('Erro inesperado: ' + array2hex([payload[1]]));
        }
    }
    else {
        console.log("Não foi possível iniciar o download da tarefa.");
    }

    return success;
}
