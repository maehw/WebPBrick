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

// This JavaScript code is used to check for compatibilities and functions to handle the user interface of the firmware downloader.

// define various control elements
const serialConnectBtn = document.getElementById('serialConnectBtn');
const downloadFirmwareBtn = document.getElementById('downloadFirmwareBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const logArea = document.getElementById('logArea');
const preambleFast = new Uint8Array([0xFF]); // all messages in fast mode begin with this byte

let serialConnected = false;

// Helper to check if browser supports WASM
const wasmSupported = (() => {
    // from here: https://stackoverflow.com/questions/47879864/how-can-i-check-if-a-browser-supports-webassembly
    try {
        if (typeof WebAssembly === "object"
            && typeof WebAssembly.instantiate === "function") {
            // magic number '\0', 'a', 's', 'm', followed by version number 1 encoded as uint32
            const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
            if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
        }
    } catch (e) {
    }
    return false;
})();

document.addEventListener('DOMContentLoaded', () => {
  // Feature detection
  const webSerialNotSupported = document.getElementById('webserial-not-supported');
  if(!('serial' in navigator)) {
    // show hidden error banner, deactivate connect button and log to console
    webSerialNotSupported.style.display = "block";
    console.log("Web Serial not supported.");
    disableSerialConnectBtn();
  }

  const wasmNotSupported = document.getElementById('wasm-not-supported');
  if(!wasmSupported) {
    // show hidden error banner, deactivate connect button and log to console
    wasmNotSupported.style.display = "block";
    console.log("WebAssembly (WASM) not supported.");
    disableCompileBtn();
  }

  serialConnectBtn.addEventListener('click', clickSerialConnect);
  downloadFirmwareBtn.addEventListener('click', clickFwDownload);
});

// Helper to sleep, i.e. add delay
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// Disable the Download buttons initially
disableDownloadFirmwareBtn();

function disableSerialConnectBtn() {
  serialConnectBtn.disabled = true; // Disable serial connection button
  serialConnectBtn.style.color = 'gray'; // Change text color to indicate connected state or missing functionality support
}

function enableSerialConnectBtn() {
  serialConnectBtn.disabled = false; // Enable serial connection button
  serialConnectBtn.style.color = ''; // Reset text color
}

clearLogBtn.addEventListener('click', () => {
  logArea.value = ''; // Clear log
});

// Function to enable the firmware download button
function enableDownloadFirmwareBtn() {
  downloadFirmwareBtn.disabled = false;
  downloadFirmwareBtn.style.color = ''; // Reset text color
}

// Function to disable the download firmware button
function disableDownloadFirmwareBtn() {
  downloadFirmwareBtn.disabled = true;
  downloadFirmwareBtn.style.color = 'gray'; // Set text color to gray
}

/**
 * @name clickSerialConnect
 * Click handler for the connect/disconnect button.
 */
async function clickSerialConnect() {
  let success = true;

  if (!serialConnected) {
    success = await serialConnect();

    if(success) {
      success = await ping();

      if(!success) {
        showErrorMsg("No communication with RCX possible.\n" +
               "RCX needs to be switched on and placed close to the IR tower and also in line of sight.\n" +
               "Please try again.");
      } else {
        showInfoMsg("🔗 Communication working, RCX is alive!");

        fwVersion = await checkFirmware();

        if(fwVersion == null) {
            showErrorMsg("Unable to determine firmware version.");
        } else {
          if(fwVersion == '0.0') {
            showErrorMsg("Firmware version '0.0' indicates that currently no firmware is loaded into RAM. " +
              "Download of programs to the RCX is not possible. Good that you are here!");
            // will work anyways, because that's why they're here!
          }

          await checkBatteryLevel();

          enableDownloadFirmwareBtn();
          serialConnectBtn.innerHTML = '🔗 Serial Disconnect';
          serialConnected = true;
        }
      }
    }
  } else {
    success = await serialDisconnect();

    if(success) {
      disableDownloadFirmwareBtn();
      serialConnectBtn.innerHTML = '🔗 Serial Connect';
      serialConnected = false;
    }
  }
}

/**
  * Returns a Uint8Array() message ready for transmission.
  * The toggle bit is toggled after every function call.
  */
function encodeCommandFast(opcode, params) {
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
        console.log("Wrong number of parameters!");
        // wrong number of parameters
        return emptyMsg;
    }

    // one more bytes for opcode, one more byte for checksum
    let cmdMsg = new Uint8Array(preambleFast.length + 1 + params.length + 1);

    // fill with preamble
    cmdMsg.set(preambleFast, 0);

    // set toggle bit every second time
    txOpcode |= (encodeCommand.toggleBit << 3);
    console.log("[OPT] " + array2hex(new Uint8Array([txOpcode])) +
                       " (original: " + array2hex(new Uint8Array([opcode])) + ")");
    // toggle the toggle bit for the next op
    encodeCommand.toggleBit = !encodeCommand.toggleBit;

    // fill with opcode
    cmdMsg.set([txOpcode], preambleFast.length);

    // fill parameter bytes and calculate checksum for the current command while doing so
    let checksum = txOpcode;
    if(params.length > 0) {
      console.log("[PRMS] " + array2hex(new Uint8Array(params)));
    }
    for(let i = 0; i<params.length; i++) {
        checksum += params[i];

        cmdMsg.set([params[i]], preambleFast.length + 1 + i);
    }
    checksum %= 256;

    // set the checksum as part of the message
    cmdMsg.set([checksum], cmdMsg.length - 1);

    return cmdMsg;
}


/**
  * On error returns received message without payload, but with complement bytes for further analysis
  */
function extractReplyFast(rxMsg, quiet=false) {
    // throw away the preamble at the beginning as it does not contain any info (remove more redundancy)
    rxMsg = rxMsg.slice(preamble.length);

    if(rxMsg.length < 1) {
        // expect at least 1 byte for the checksum
        if(!quiet) {
            console.log("[XTRF] message too short: " + rxMsg.length);
        }
        return {valid: false, payload: rxMsg};
    }

    // verify checksum and check complements
    let checksum = 0;
    for(let i=0; i<rxMsg.length - 1; i += 1) {
        checksum += rxMsg[i];
    }
    checksum %= 256;

    // check if received checksum matches calculated checksum
    if(rxMsg[rxMsg.length - 1] != checksum) {
        return {valid: false, payload: rxMsg};
    }

    // throw away checksum byte
    let replyPayload = rxMsg.slice(-1);

    return {valid: true, payload: replyPayload};
}

async function transceiveCommandFast(opcode, params = new Uint8Array(), timeout = 500, ignoreReply = false) {
    const txMsg = encodeCommandFast(opcode, params);

    if(txMsg.length == 0) {
        console.log("[TXMF] encoding error, wrong number of parameters");
        return {success: false, payload: null};
    }
    if(txMsg.length < preambleFast.length) {
        return {success: false, payload: null};
    }
    opcode = txMsg[preambleFast.length]; // take opcode from transmit messages as toggle bit may have been set

    console.log("[TXMF]", array2hex(txMsg));
    await serialWriter.write(txMsg);

    await sleep(timeout);
    let rxMsg = await serialReadWithTimeout(timeout);
    console.log("[RXMF]", array2hex(rxMsg));

    if(ignoreReply) {
        console.log("[RPLF] ignoring reply");
        return {success: true, payload: null};
    }

    if(rxMsg.length < txMsg.length) {
        // RX message is so short that it cannot even include an echo
        return {success: false, payload: null};
    }

    // check if RX message starts with echo of TX message
    const hasEcho = rxMsg.join(',').startsWith(txMsg.join(',')); // FIXME: do not use lazy string comparison but something more efficient
    if(!hasEcho) {
        return {success: false, payload: null};
    }

    // throw away the echo part at the beginning as it does not contain any info (remove redundancy)
    rxMsg = rxMsg.slice(txMsg.length);

    // check if reply also starts with preamble
    // NOTE: the regular 3 byte preamble is used in the reply!
    const hasPreamble = rxMsg.join(',').startsWith(preamble.join(',')); // FIXME: do not use lazy string comparison but something more efficient
    if(!hasPreamble) {
        return {success: false, payload: null};
    }

    const reply = extractReplyFast(rxMsg);
    console.log("[RPLF] valid? " + reply.valid + ", payload: " + array2hex(reply.payload));

    // check reply payload
    if(!reply.valid) {
        // let's hand the payload also back, there may be special handling on higher level
        console.log("[CMDF] message decode error");
        return {success: false, payload: reply.payload};
    }
    else {
        // does the first reply payload byte match as a complement to the command opcode?
        if((reply.payload[0] ^ opcode) != 0xFF) {
            console.log("[CMDF] invalid reply");
            // let's hand the payload also back, there may be special handling on higher level
            return {success: false, payload: reply.payload};
        }
        else {
            console.log("[CMDF] success");
            return {success: true, payload: reply.payload};
        }
    }
}

async function pingFast() {
  console.log("Ping (fast)...");
  let {success, payload} = await transceiveCommandFast(OpCode.Ping);

  if(success) {
    console.log("Programmable brick is alive.");
  }
  else {
    console.log("Programmable brick is not alive.");
  }

  return success;
}

// Send command to send RCX into boot mode
async function goIntoBootModeFast() {
    console.log("Going into boot mode (fast).");
    let {success, payload} = await transceiveCommandFast(OpCode.GoIntoBootMode, oddPrimes);
    return success;
}

// Download firmware to RCX programmable brick
async function downloadFirmwareFast(description="firmware", firmwareData=[]) {
    // prepare download
    const firmwareSize = firmwareData.length;
    showInfoMsg("🧮 " + capitalize(description) + " size in bytes: " + firmwareSize);

    const firmwareChecksum = calculateFirmwareChecksum(firmwareData);
    showInfoMsg("🧮 Calculated " + description + " checksum: 0x" + firmwareChecksum.toString(16).padStart(4, '0').toUpperCase());

    let success = false;
    let numPings = 0;
    while(!success && (numPings < 3)) {
      success = await pingFast();
      numPings++;
    }

    if(success) {
      showInfoMsg("Attempting to enter boot mode.");

      success = false;
      let numBootModeAttempts = 0;
      while(!success && (numBootModeAttempts < 5)) {
        success = await goIntoBootModeFast();
        numBootModeAttempts++;
      }
    }

    // TODO: tbc

    return success;
}

// Handler for click on firmware download button
async function clickFwDownload() {
  // Open a dialog first to let the user confirm the download before starting it
  const confirmedFwDownload = window.confirm("Firmware download is quite slow and will take several minutes. " +
    "Firmware download may fail. It may render your RCX (temporarily) unusable." +
    "\n\nI know what I am doing and want to continue.");

  if(confirmedFwDownload) {
    console.log("Firmware download request confirmed.");
    showInfoMsg("Firmware download request confirmed.");

    // TODO: add mechanism to choose between different firmware versions

    let firmwareName = "RCX firmware";
    success = await downloadFirmware(firmwareName, firm0332Data);

/*
    // TODO: make fast download work (via firmdl3 stub)
//    let stubName = "fastdl stub";
//    let success = await downloadFirmware(stubName, firmdl3FastdlStubData);
    if(success) {
      success = await serialSetSpeed(true);

      if(success) {
        success = await downloadFirmwareFast(firmwareName, firm0332Data);

        await serialSetSpeed(false);
      }
    }
*/

    if(success) {
      showInfoMsg("✅ " + capitalize(firmwareName) + " download complete. 🎉");
    }

    if(!success) {
        showErrorMsg("Failed to download firmware. Make sure the RCX is switched on " +
            "and in line of sight of the IR tower. Please retry!");
    }

    showInfoMsg("Please disconnect and re-connect!");
  } else {
      console.log("Firmware download request aborted.");
      showInfoMsg("Firmware download request aborted.");
  }
}
