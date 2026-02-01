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

// This JavaScript code is used for serial communication with the RCX programmable brick via a LEGO Serial IR Tower or DIY IR Tower.

'use strict';

// TODO: add proper source code comments, at least for every function
// TODO: check if toggle bit functionality shall be opcode-bound or whether its okay to toggle just every time!

let serialPort = null;
let serialReader = null;
let serialWriter = null;

// define various control elements
const log = document.getElementById('logArea');

// timeout of 350 ms calculated for current 2400 baud configuration and flight time of "download firmware" command including its payload
async function transceiveCommand(opcode, params = new Uint8Array(), timeout = 340, ignoreReply = false) {
    const txMsg = encodeCommand(opcode, params);

    if(txMsg.length == 0) {
        console.log("[TXM] Erro de codificação, número errado de parâmetros");
        return {success: false, payload: null};
    }
    if(txMsg.length < preamble.length) {
        return {success: false, payload: null};
    }
    opcode = txMsg[preamble.length]; // take opcode from transmit messages as toggle bit may have been set

    console.log("[TXM]", array2hex(txMsg));
    await serialWriter.write(txMsg);

    await sleep(timeout);
    let serialReadResult = await serialReadWithTimeout(timeout);
    let rxMsg = serialReadResult.value;

    console.log("[RXM]", array2hex(rxMsg));

    // UART parity and frame error handling: try reconnecting
    // this is "glitch handling": a glitch may have falsely been detected as UART word,
    // let's clear the hardware(!) buffer and make sure we re-sync on the next start bit correctly
    if(serialReadResult.channelError) {
        console.log("Attempting serial reconnect.");
        let reconnectResult = await serialReconnect();
        if(!reconnectResult) {
            console.log("Serial reconnect attempt failed.");
            return {success: false, payload: null};
        }
    }

    if(ignoreReply) {
        console.log("[RPL] ignoring reply");
        return {success: true, payload: null};
    }

    if(rxMsg.length < txMsg.length) {
        // RX message is so short that it cannot even include an echo
        return {success: false, payload: null};
    }

    // check if RX message starts with echo of TX message
    const hasEcho = rxMsg.join(',').startsWith(txMsg.join(',')); // FIXME: do not use lazy string comparison but something more efficient
    let hasGlitchyEcho = false;
    if(!hasEcho) {
        console.log("[RPL] missing echo");
        hasGlitchyEcho = rxMsg.join(',').slice(1).startsWith(txMsg.join(',')); // FIXME: do not use lazy string comparison but something more efficient
        if(!hasGlitchyEcho) {
            console.log("[RPL] not even a glitchy echo");
            return {success: false, payload: null};
        }
    }

    // throw away the echo part at the beginning as it does not contain any info (remove redundancy)
    rxMsg = rxMsg.slice(txMsg.length);
    if(hasGlitchyEcho) {
        // remove one more byte from response
        rxMsg = rxMsg.slice(1);
    }

    // check if reply also starts with preamble
    const hasPreamble = rxMsg.join(',').startsWith(preamble.join(',')); // FIXME: do not use lazy string comparison but something more efficient
    if(!hasPreamble) {
        return {success: false, payload: null};
    }

    const reply = extractReply(rxMsg);
    console.log("[RPL] valid? " + reply.valid + ", payload: " + array2hex(reply.payload));

    // check reply payload
    if(!reply.valid) {
        // let's hand the payload also back, there may be special handling on higher level
        console.log("[CMD] message decode error");
        return {success: false, payload: reply.payload};
    }
    else {
        // does the first reply payload byte match as a complement to the command opcode?
        if((reply.payload[0] ^ opcode) != 0xFF) {
            console.log("[CMD] invalid reply");
            // let's hand the payload also back, there may be special handling on higher level
            return {success: false, payload: reply.payload};
        }
        else {
            console.log("[CMD] success");
            return {success: true, payload: reply.payload};
        }
    }
}

/**
 * @name Serial connect
 * Opens a Web Serial connection to an RCX programmable brick
 */
async function serialConnect(fastMode=false) {
  let success = true; // think positive!
	let speedText = "slow";
	if(fastMode) {
		speedText = "fast";
	}

  // Request a port and open a connection
  if(serialPort === null) {
    try {
      serialPort = await navigator.serial.requestPort();
    }
    catch(e) {
      showErrorMsg("Falha ao abrir a porta serial: '" + e.message + "'");
      success = false;
    }
  }

  if(success) {
    // Wait for the port to open.
    // Slow mode (default for now): configure 2400 baud, 8-O-1, increase buffer size instead of the default 255 bytes
    // FIXME: Some buffer does not seem to be consumed or flushed properly?! Waiting for a line break?!
    let baudRate = 2400;
	  let parity = "odd";
    if(fastMode) {
      // firmdl3 fast mode: increase baud rate and switch to "no parity"
      baudRate = 4800;
      parity = "none";
    }
    const serialParams = { baudRate: baudRate, parity: parity, bufferSize: 3*32*1024 };

    try {
      console.log("Trying to open serial port.");
      await serialPort.open(serialParams);

      const serialPortInfo = serialPort.getInfo();
      console.log("Conectado ao dispositivo serial (baudrate: " + serialParams.baudRate + ").");
      showInfoMsg("Conectado ao dispositivo serial (baudrate: " + serialParams.baudRate + ").");

      serialReader = serialPort.readable.getReader();
      serialWriter = serialPort.writable.getWriter();
    }
    catch(e) {
      if((e instanceof DOMException) && e.name == 'InvalidStateError') {
        // ignore: port has already been opened before, something else must have failed, so let's continue
      }
      else {
        throw e;
      }
    }
  }

  return success;
}

async function serialSetSpeed(fastMode=true) {
  let success = true; // think positive!

  // Reconnect on known port with different settings
  if(serialPort === null) {
      success = false;
  } else {
    console.log("Disconnecting...");
    showInfoMsg("Disconnecting...");
    success = await serialDisconnect(true);

    if(success) {
      console.log("Reconnecting...");
      showInfoMsg("Reconnecting...");
      // Does not take care of current mode (i.e. fast or not)
      success = await serialConnect();
    }
  }

  return success;
}

async function checkFirmware() {
  let success = true; // think positive!
  let versionInfo = null;
  let fwVersion = null;

  versionInfo = await getVersions();
  if(!versionInfo.success) {
      showErrorMsg("Failed to retrieve ROM and firmware versions.");
      success = false;
  }

  if(success) {
      showInfoMsg("ℹ️ versão da ROM: " + versionInfo.romVersion + ", versão do Firmware: " + versionInfo.fwVersion);
      fwVersion = versionInfo.fwVersion;
  }

  return fwVersion;
}

async function checkBatteryLevel() {
  const batteryLevel = await getBatteryLevel();
  let msg = "";
  if(batteryLevel > 0) {
    if(batteryLevel < 20) {
      msg = "🪫";
    }
    else {
      msg = "🔋";
    }
    msg += " Nível da bateria: " + Math.floor(batteryLevel) + " %";
    showInfoMsg(msg);
  }
}

async function serialReadWithTimeout(timeout) {
  // inspired by https://github.com/WICG/serial/issues/122

  let timer = setTimeout(() => {
      serialReader.releaseLock();
  }, timeout);

  let result = {done: false, value: new Uint8Array()};

  try {
      result = await serialReader.read();
  }
  catch (e) {
    // make sure to detect and handle timeout errors and re-throw other type of exceptions
    if (e instanceof TypeError) {
        console.log("Tempo limite esgotado!");
        result.channelError = false;
    } else if (e instanceof DOMException) {
      if(e.name == 'FramingError') {
        console.log("Framing error occurred!");
        result.channelError = true;
      } else if (e.name == 'ParityError') {
        console.log("Parity error occurred!");
        result.channelError = true;
      } else {
        console.log("Unhandled DOMException!");
        result.channelError = false;
        throw(e);
      }
    } else {
        result.channelError = false;
      throw(e);
    }
  }
  clearTimeout(timer);

  return result.value;
}

/**
 * @name Disconnect serial
 * Closes the Web Serial connection.
 */
async function serialDisconnect(keepPort=false) {
  if (serialReader) {
    serialReader.releaseLock();
    serialReader = null;
  }
  if (serialWriter) {
    serialWriter.releaseLock();
    serialWriter = null;
  }

  // Close the port.
  await serialPort.close();
  if(!keepPort) {
    serialPort = null;
  }

  showInfoMsg("Desconectado da torre serial.");
  return true;
}

