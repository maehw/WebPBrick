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

// This JavaScript code is used for serial communication with the RCX programmable brick via a LEGO Serial IR Tower or DIY IR Tower.

'use strict';

// TODO: add proper source code comments, at least for every function
// TODO: check if toggle bit functionality shall be opcode-bound or whether its okay to toggle just every time!

let serialPort;
let serialReader;
let serialWriter;

// define various control elements
const log = document.getElementById('logArea');
const butConnect = document.getElementById('serialConnectBtn');
const butFwDownload = document.getElementById('downloadFirmwareBtn');
const butProgramDownload = document.getElementById('downloadBtn');

document.addEventListener('DOMContentLoaded', () => {
  butConnect.addEventListener('click', clickSerialConnect);
  butFwDownload.addEventListener('click', clickFwDownload);
  butProgramDownload.addEventListener('click', clickProgramDownload);
});

// UI related helper functions
function disableFwDownloadBtn() {
  butFwDownload.disabled = true;
  butFwDownload.style.color = 'gray';
}

function disableProgramDownloadBtn() {
  butProgramDownload.disabled = true;
  butProgramDownload.style.color = 'gray';
}

function disableDownloadsBtns() {
  disableFwDownloadBtn();
  disableProgramDownloadBtn();
}

async function transceiveCommand(opcode, params = new Uint8Array(), timeout = 500, ignoreReply = false) {
    const txMsg = encodeCommand(opcode, params);

    if(txMsg.length == 0) {
        console.log("[TXM] encoding error, wrong number of parameters");
        return {success: false, payload: null};
    }
    if(txMsg.length < preamble.length) {
        return {success: false, payload: null};
    }
    opcode = txMsg[preamble.length]; // take opcode from transmit messages as toggle bit may have been set

    console.log("[TXM]", array2hex(txMsg));
    await serialWriter.write(txMsg);

    await sleep(timeout);
    let rxMsg = await serialReadWithTimeout(timeout);
    console.log("[RXM]", array2hex(rxMsg));

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
    if(!hasEcho) {
        return {success: false, payload: null};
    }

    // throw away the echo part at the beginning as it does not contain any info (remove redundancy)
    rxMsg = rxMsg.slice(txMsg.length);

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
async function serialConnect() {
    // Request a port and open a connection.
    serialPort = await navigator.serial.requestPort();
    // Wait for the port to open.
    // Configure 2400 baud, 8-O-1, increase buffer size instead of the default 255 bytes
    // FIXME: Some buffer does not seem to be consumed or flushed properly?! Waiting for a line break?!
    const serialParams = { baudRate: 2400, parity: "odd", bufferSize: 3*32*1024 };
    await serialPort.open(serialParams);

    const serialPortInfo = serialPort.getInfo();
    showInfoMsg("Connected to serial device (baudrate: " + serialParams.baudRate + ").");

    serialReader = serialPort.readable.getReader();
    serialWriter = serialPort.writable.getWriter();
    let versionInfo = null;

    let success = await ping();
    if(!success) {
        showErrorMsg("No communication with RCX possible.\n" +
                     "RCX needs to be switched on and placed close to and in line of sight of the IR tower.");
        disableDownloadsBtns();
    }

    if(success) {
        showInfoMsg("🔗 Communication working, RCX is alive!");

        versionInfo = await getVersions();
        if(!versionInfo.success) {
            showErrorMsg("Failed to retrieve ROM and firmware versions.");
            success = false;
        }
    }

    if(success) {
        showInfoMsg("ℹ️ ROM version: " + versionInfo.romVersion + ", Firmware version: " + versionInfo.fwVersion);
        butFwDownload.disabled = false; // enable firmware download

        if(versionInfo.fwVersion == '0.0') {
            showErrorMsg("Firmware version '0.0' indicates that currently no firmware is loaded into RAM.");
            disableProgramDownloadBtn();
            success = false;
        }
        else {
            butProgramDownload.disabled = false; // enable program download; could limit this to known, compatible versions
        }
    }

    if(success) {
        const batteryLevel = await getBatteryLevel();
        let msg = "";
        if(batteryLevel > 0) {
            if(batteryLevel < 20) {
                msg = "🪫";
            }
            else {
                msg = "🔋";
            }
            msg += " Battery level: " + Math.floor(batteryLevel) + " %";
            showInfoMsg(msg);
        }
    }

    if(success && versionInfo) {
        success = await playSystemSound(SystemSound.Beep);

        if(!success) {
            showErrorMsg("Unable to play system sound.");
        }
    }
    if(success) {
        showInfoMsg("🎵 Played system sound.");
    }

    // Allow the serial port to be closed later.
    serialWriter.releaseLock();
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
            console.log("Timeout error occurred!");
        }
        else {
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
async function serialDisconnect() {
  if (serialReader) {
    serialReader.releaseLock();
    serialReader = null;
  }
  if (serialWriter) {
    serialWriter = null;
  }

  // Close the port.
  await serialPort.close();
  serialPort = null;

  log.textContent += "Disconnected from serial device.\n";
}

/**
 * @name clickSerialConnect
 * Click handler for the connect/disconnect button.
 */
async function clickSerialConnect() {
  // Disconnect
  if (serialPort) {
    await serialDisconnect();
    return;
  }

  // Connect
  await serialConnect();
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

        serialWriter = serialPort.writable.getWriter();

        const success = await downloadFirmware();
        if(success) {
            showInfoMsg("✅ Firmware download complete. 🎉");
        }
        else {
            showErrorMsg("Failed to download firmware. Make sure the RCX is switched on " +
                "and in line of sight of the IR tower. Please retry!");
        }
        showInfoMsg("Please disconnect and re-connect!");

        // Allow the serial port to be closed later.
        serialWriter.releaseLock();
    }
    else {
        console.log("Firmware download request aborted.");
        showInfoMsg("Firmware download request aborted.");
    }
}

// Handler for clic on program download button
async function clickProgramDownload() {
    if(rcxBinary === null) {
        showErrorMsg("No program to download. Need to build the NQC code first!");
    }
    else {
        showInfoMsg("Program download requested.");

        serialWriter = serialPort.writable.getWriter();

        const programNumber = 0; // TODO: make program slot selectable
        let success = await downloadProgram(programNumber, rcxBinary);
        if(success) {
            showInfoMsg("️✅ Download of program succeeded! 🎉 " +
                "Press the green 'Run' button 🟢▶️ on the RCX to start execution of the program!");

            success = await playSystemSound(SystemSound.FastSweepUp);

            if(success) {
                showInfoMsg("🎵 Played system sound.");
            }
            else {
                showErrorMsg("Unable to play system sound.");
            }
        }
        else {
            showErrorMsg("Download of program may have failed.");
        }

        // Allow the serial port to be closed later.
        serialWriter.releaseLock();
    }
}
