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

// This JavaScript code is used for serial communication with the RCX programmable brick via a LEGO USB IR Tower.
//  The USB device
// - is compliant with USB version 1.1,
// - has two interrupt endpoints,
//   (endpoint 1 is used for device-to-host communications,
//    endpoint 2 is used for host-to-device communications)
// - implements a vendor-specific device class (no HID or other USB class standards).
// There's an official document from TLG called "LEGO USB Tower Interface Reference" which
// describes the vendor-specific requests.
//
// Notes on how the USB tower differs from the serial tower (verified with a real tower):
// - All vendor requests are device-to-host control transfers (bmRequestType 0xC0), even the "set" requests.
//   The tower answers each of them with a small reply: 2 bytes reply size, 1 byte error code, 1 byte value, ...
// - The USB tower does not echo the bytes which have been sent, so there's no echo to remove from the reply.
// - Received IR bytes arrive in packets of up to 8 bytes on the interrupt IN endpoint.

'use strict';

let usbDevice = null;
let usbTxEndpoint = null;
let usbRxEndpoint = null;
let usbPendingRead = null; // an IN transfer which has been started but has not delivered a packet yet

const USB_VENDOR_ID = 0x0694;
const USB_PRODUCT_ID = 0x0001;
const USB_DEV_CONFIG_ID = 1;
const USB_INTERFACE_ID = 0;
const USB_PACKET_SIZE = 8; // maximum packet size of both interrupt endpoints

const USB_IR_BYTE_TIME = 4.6; // milliseconds needed to transfer one byte via IR at 2400 baud (8-O-1)
const USB_QUIET_TIME = 40; // a reply is considered complete when no more bytes arrive for this time (in ms)
const USB_MAX_ATTEMPTS = 3; // how often a command is sent until the RCX replies

// Location of the Windows driver setup script; it's stored next to this file, wherever the page is.
const usbDriverSetupUrl = new URL('windows/lego-usb-tower-winusb-setup.cmd',
                                  document.currentScript ? document.currentScript.src : document.baseURI).href;

// vendor request IDs (used in 1 byte bRequest)
const LTW_REQ_GET_PARM = 0x01; // get tower parameter for standard IR mode
const LTW_REQ_SET_PARM = 0x02; // set tower parameter for standard IR mode
const LTW_REQ_SET_PARM_IRC = 0x12; // set Infrared Remote Control (IRC) tower parameter
const LTW_REQ_GET_PARM_IRC = 0x11; // get IRC tower parameter
const LTW_REQ_FLUSH = 0x03; // flush selected communication buffer(s)
const LTW_REQ_RESET = 0x04; // reset ports and all internal parameters to the default values (used in case of a tower-internal error)
const LTW_REQ_GET_STAT = 0x05; // get statistics from the IR receiver since the last RESET_STAT command
const LTW_REQ_RESET_STAT = 0x10; // reset statistics from the IR receiver
const LTW_REQ_GET_POWER = 0x06; // get the tower power configuration (also available via USB device descriptor)
const LTW_REQ_SET_LED = 0x09; // set the state of the green ID LED (when set to SW control) or the VLL LED
const LTW_REQ_GET_LED = 0x08; // get the state of the green ID LED or the VLL LED
const LTW_REQ_SET_TX_SPEED = 0xEF; // set IR transmit speed (switch baud rate; 1200/2400/4800/9600/19200)
const LTW_REQ_GET_TX_SPEED = 0xEE; // get IR transmit speed
const LTW_REQ_SET_RX_SPEED = 0xF1; // set IR receive speed (switch baud rate); when RX/TX speeds differ: SET_TX_SPEED first
const LTW_REQ_GET_RX_SPEED = 0xF0; // get IR receive speed
const LTW_REQ_SET_TX_CARRIER_FREQUENCY = 0xF4; // set TX carrier frequency, i.e. 38 kHz (at 2400 baud) or 76 kHz (at 4800 baud)
const LTW_REQ_GET_TX_CARRIER_FREQUENCY = 0xF3; // get TX carrier frequency
const LTW_REQ_SET_TX_CARRIER_DUTY_CYCLE = 0xF6; // set TX carrier duty cycle
const LTW_REQ_GET_TX_CARRIER_DUTY_CYCLE = 0xF5; // unused; get TX duty cycle
const LTW_REQ_GET_CAPS = 0xFC; // get list of the tower capabilities according to the requested link type
const LTW_REQ_GET_VERSION = 0xFD; // get tower firmware version information
const LTW_REQ_GET_TX_STATE = 0xF2; // get state of the transmitter (ready/busy)
const LTW_REQ_GET_COPYRIGHT = 0xFE; // get copyright information
const LTW_REQ_GET_CREDITS = 0xFF; // get credits list

// error codes (used as 1 byte bErrCode)
const LTW_REQERR_SUCCESS = 0x00; // request succeeded
const LTW_REQERR_BADPARM = 0x01; // bad vendor parameter and/or value
const LTW_REQERR_BUSY = 0x02; // tower is busy
const LTW_REQERR_NOPOWER = 0x03; // not enough power to carry out the requested operation
const LTW_REQERR_WRONGMODE = 0x04; // not in the right mode to execute this request
const LTW_INTERNAL_ERROR = 0xFE; // internal error in the tower
const LTW_REQERR_BADREQUEST = 0xFF; // bad request

// parameter IDs (used as LOBYTE part of the 2 byte wValue; the parameter value is the HIBYTE part)
const LTW_PARM_MODE = 0x01; // tower mode
const LTW_PARM_RANGE = 0x02; // transmission range: Short, Medium (default) or Long
const LTW_PARM_ERRDETECT = 0x03; // error detection on IR receiver
const LTW_PARM_ERRSTATUS = 0x04; // current internal error status of the tower (default: no error)
const LTW_PARM_ENDIAN = 0x97; // vendor request word format: Little Endian (PC/Windows standard; default) or Big Endian (Apple/Motorola standard)
const LTW_PARM_ID_LED_MODE = 0x98; // Indicator LED control: Firmware-controlled (default) or Host controlled
const LTW_PARM_ERROR_SIGNAL = 0x99; // Signal indicator LED on when serious internal error occurs: On (default)/Off
// const LTW_PARM_IRC_PACKETSIZE = ... // Packet size (in bytes) for Infrared Remote Control (IRC) protocol for LEGO cars
// const LTW_PARM_IRC_DELAY_TX = ... // Transmit delay (in ms) in between IRC packets

// parameter values for LTW_PARM_MODE
const LTW_MODE_VLL = 0x01;
const LTW_MODE_IR = 0x02;
const LTW_MODE_IRC = 0x04;

// parameter values for LTW_PARM_RANGE
const LTW_RANGE_SHORT = 0x01;
const LTW_RANGE_MEDIUM = 0x02;
const LTW_RANGE_LONG = 0x03;

// parameter value IDs
const SPEED_COMM_BAUD_1200 = 0x0004;
const SPEED_COMM_BAUD_2400 = 0x0008;
const SPEED_COMM_BAUD_4800 = 0x0010;
const SPEED_COMM_BAUD_9600 = 0x0020;
const SPEED_COMM_BAUD_19200 = 0x0040;

function errorCodeToString(errCode) {
    let str = null;
    switch(errCode) {
        case LTW_REQERR_SUCCESS:
            str = "LTW_REQERR_SUCCESS";
            break;
        case LTW_REQERR_BADPARM:
            str = "LTW_REQERR_BADPARM";
            break;
        case LTW_REQERR_BUSY:
            str = "LTW_REQERR_BUSY";
            break;
        case LTW_REQERR_NOPOWER:
            str = "LTW_REQERR_NOPOWER";
            break;
        case LTW_REQERR_WRONGMODE:
            str = "LTW_REQERR_WRONGMODE";
            break;
        case LTW_INTERNAL_ERROR:
            str = "LTW_INTERNAL_ERROR";
            break;
        case LTW_REQERR_BADREQUEST:
            str = "LTW_REQERR_BADREQUEST";
            break;
        default:
            str = "<unknown>";
            break;
    }

    return str;
}

/**
 * Send a vendor request to the USB tower.
 * Returns the reply (a Uint8Array including the 4 header bytes) or null if the request has failed.
 */
async function usbTowerRequest(request, value = 0, length = 8) {
  const setup = {requestType: "vendor", recipient: "device", request: request, value: value, index: 0};
  const result = await usbDevice.controlTransferIn(setup, length);

  if((result.status != 'ok') || (result.data === undefined) || (result.data.byteLength < 3)) {
    console.log("USB tower request " + array2hex([request]) + " failed, status: " + result.status);
    return null;
  }

  const reply = new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength);
  console.log("USB tower request " + array2hex([request]) + " (value " + value + ") reply: " + array2hex(reply));
  const errCode = reply[2];
  if(errCode != LTW_REQERR_SUCCESS) {
    console.log("USB tower request " + array2hex([request]) + " failed, error code: " + errorCodeToString(errCode));
    return null;
  }

  return reply;
}

async function getUsbTowerFwVersion() {
  // request firmware version
  const reply = await usbTowerRequest(LTW_REQ_GET_VERSION, 0, 8);
  let version = "";

  if((reply !== null) && (reply.length >= 8)) {
    const majorVersion = reply[4];
    const minorVersion = reply[5];
    const buildNoVersion = to16bit(reply.slice(6, 8), false);
    version = majorVersion + "." + minorVersion + " build " + buildNoVersion;
  }

  return version;
}

async function setUsbTowerParameter(parameter, value) {
  // the parameter ID is the low byte and its value is the high byte of the request's wValue
  const reply = await usbTowerRequest(LTW_REQ_SET_PARM, (parameter & 0xFF) | ((value & 0xFF) << 8), 8);
  return (reply !== null);
}

async function resetUsbTower() {
  // request reset (green LED should light up)
  const reply = await usbTowerRequest(LTW_REQ_RESET, 0, 4);
  return (reply !== null);
}

async function getStatistics() {
  // request statistics from IR tower
  const reply = await usbTowerRequest(LTW_REQ_GET_STAT, 0, 12);
  const success = (reply !== null) && (reply.length == 12);

  if(success) {
    const rxByteCount = to16bit(reply.slice(4, 6), false);
    const overrunErrCount = to16bit(reply.slice(6, 8), false);
    const noiseCount = to16bit(reply.slice(8, 10), false);
    const frameErrCount = to16bit(reply.slice(10, 12), false);
    console.log(rxByteCount + " bytes received, " + overrunErrCount + " overruns, " +
      noiseCount + " wrong bits (noise), " + frameErrCount + " frame errors");
  }

  return success;
}

async function flushUsbTowerBuffers(txBuffer = true, rxBuffer = true) {
  const LTW_TX_BUFFER = 0x01;
  const LTW_RX_BUFFER = 0x02;
  let selectedBuffers = 0;
  if(txBuffer) {
    selectedBuffers |= LTW_TX_BUFFER;
  }
  if(rxBuffer) {
    selectedBuffers |= LTW_RX_BUFFER;
  }
  const reply = await usbTowerRequest(LTW_REQ_FLUSH, selectedBuffers, 4);
  return (reply !== null);
}

function isWindows() {
  if(navigator.userAgentData && navigator.userAgentData.platform) {
    return navigator.userAgentData.platform == "Windows";
  }
  return /Win/.test(navigator.platform);
}

/**
 * Explain what to do when the tower cannot be opened on Windows.
 *
 * A web page cannot install a driver itself. All it can do is offer the setup script for download,
 * which selects the WinUSB driver that is already part of Windows for the tower.
 * The dialog is built here, so that every page which uses the USB tower gets it.
 */
function showUsbDriverHelp() {
  let dialog = document.getElementById('usbDriverHelp');

  if(dialog === null) {
    dialog = document.createElement('dialog');
    dialog.id = 'usbDriverHelp';
    dialog.style.maxWidth = '34em';
    dialog.style.textAlign = 'left';
    dialog.style.lineHeight = '1.4';
    dialog.innerHTML =
      '<h3 style="margin-top: 0;">The USB tower could not be opened</h3>' +
      '<p>There are two usual reasons on Windows:</p>' +
      '<p><b>1. Another program is using the tower.</b> Close it and try again.</p>' +
      '<p><b>2. The tower does not use the WinUSB driver yet.</b> The browser needs this driver, ' +
      'which is part of Windows but has to be selected for the tower once:</p>' +
      '<ol>' +
      '<li>Download the <a id="usbDriverHelpLink" download>driver setup script</a>. ' +
      'The browser may ask whether to keep the file.</li>' +
      '<li>Leave the tower plugged in and open the downloaded file. Windows may show "Windows protected your PC" ' +
      '(choose "More info", then "Run anyway") and asks for administrator rights.</li>' +
      '<li>Come back here and try again.</li>' +
      '</ol>' +
      '<p><small>The script downloads nothing; it selects the "WinUsb Device" driver from Microsoft, like the ' +
      'Device Manager can do by hand. Alternatively, use <a href="https://zadig.akeo.ie" target="_blank" rel="noopener">Zadig</a>: ' +
      '"Options", "List All Devices", pick "LEGO USB Tower", choose "WinUSB" and install.</small></p>' +
      '<div style="text-align: right;">' +
      '<button id="usbDriverHelpRetryBtn">Try again</button> ' +
      '<button id="usbDriverHelpCloseBtn">Close</button>' +
      '</div>';
    document.body.appendChild(dialog);

    document.getElementById('usbDriverHelpLink').href = usbDriverSetupUrl;
    document.getElementById('usbDriverHelpCloseBtn').addEventListener('click', () => dialog.close());
    document.getElementById('usbDriverHelpRetryBtn').addEventListener('click', () => {
      dialog.close();
      // start over with the page's own connect button, if there is one
      const connectBtn = document.getElementById('usbConnectBtn');
      if(connectBtn !== null) {
        connectBtn.click();
      }
    });
  }

  if(!dialog.open) {
    dialog.showModal();
  }
}

/**
 * @name Connect USB device
 * Opens a WebUSB connection to a LEGO USB IR Tower
 */
async function usbConnect() {
  let success = true; // think positive!

  if(usbDevice === null) {
    try {
      // A tower which the user has already selected earlier can be used again without asking.
      const knownDevices = await navigator.usb.getDevices();
      usbDevice = knownDevices.find(obj => (obj.vendorId == USB_VENDOR_ID) && (obj.productId == USB_PRODUCT_ID)) || null;

      if(usbDevice === null) {
        // Calling the requestDevice() method triggers the user agent's pairing flow.
        // It returns a Promise that resolves with an instance of USBDevice if the specified device is found.
        usbDevice = await navigator.usb.requestDevice({ filters: [{ vendorId: USB_VENDOR_ID, productId: USB_PRODUCT_ID }] });
      }
    }
    catch(e) {
      showErrorMsg("Failed to select USB tower: '" + e.message + "'");
      usbDevice = null;
      success = false;
    }
  }

  if(success) {
    console.log("Manufacturer name:     " + usbDevice.manufacturerName);
    console.log("Product name:          " + usbDevice.productName);
    console.log("Number of device configurations: " + usbDevice.configurations.length);

    try {
      console.log("Trying to open USB device.");
      await usbDevice.open(); // Begin a session.

      // The Tower has four USB configurations:
      // 1. Low power (default)
      // 2. High power
      // 3. Low power, low bandwidth (8 ms polling interval)
      // 4. High power, low bandwith(sic!) (8 ms polling interval)
      if((usbDevice.configuration === null) || (usbDevice.configuration.configurationValue != USB_DEV_CONFIG_ID)) {
        await usbDevice.selectConfiguration(USB_DEV_CONFIG_ID);
      }
      await usbDevice.claimInterface(USB_INTERFACE_ID);

      const usbInterface = usbDevice.configuration.interfaces.find(obj => obj.interfaceNumber == USB_INTERFACE_ID);
      usbTxEndpoint = usbInterface.alternate.endpoints.find(obj => obj.direction === 'out').endpointNumber;
      usbRxEndpoint = usbInterface.alternate.endpoints.find(obj => obj.direction === 'in').endpointNumber;
      console.log("TX endpoint is #" + usbTxEndpoint + ", RX endpoint is #" + usbRxEndpoint);
    }
    catch(e) {
      showErrorMsg("Failed to open USB tower: '" + e.message + "'\n" +
                   "Make sure that no other program is using the tower. " +
                   "On Windows, the tower needs the WinUSB driver to be usable from the browser.");
      if(isWindows()) {
        showUsbDriverHelp();
      }
      await usbDisconnect(true);
      success = false;
    }
  }

  if(success) {
    try {
      const version = await getUsbTowerFwVersion();
      if(version == "") {
        showErrorMsg("Unable to read firmware version from USB tower.");
        success = false;
      }
      else {
        console.log("Connected to USB tower (tower firmware version: " + version + ").");
        showInfoMsg("Connected to USB tower (tower firmware version: " + version + ").");
      }

      // let the tower use its full transmission power; the connection is still usable if this fails
      if(success) {
        const rangeSet = await setUsbTowerParameter(LTW_PARM_RANGE, LTW_RANGE_LONG);
        if(!rangeSet) {
          showInfoMsg("Unable to set the USB tower's transmission range, continuing with its current setting.");
        }
      }
    }
    catch(e) {
      showErrorMsg("Failed to communicate with USB tower: '" + e.message + "'");
      success = false;
    }

    if(!success) {
      await usbDisconnect(true);
    }
  }

  if(success) {
    // from now on, commands for the RCX go through the USB tower
    setTransceiver(usbTransceiveCommand);
  }

  return success;
}

/**
 * Wait for one packet of received IR bytes.
 * Returns a Uint8Array (which may be empty) or null if no packet has arrived within the timeout.
 *
 * WebUSB cannot cancel an IN transfer. That's why a transfer which has timed out here is kept
 * and is waited for again with the next call - otherwise the bytes it finally delivers would get lost.
 */
async function usbReadPacket(timeout) {
  if(usbPendingRead === null) {
    usbPendingRead = usbDevice.transferIn(usbRxEndpoint, USB_PACKET_SIZE).then(
      (result) => ({result: result, error: null}),
      (error) => ({result: null, error: error}));
  }

  let timer = null;
  const timedOut = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeout);
  });
  const outcome = await Promise.race([usbPendingRead, timedOut]);
  clearTimeout(timer);

  if(outcome === null) {
    return null; // nothing received (yet)
  }
  usbPendingRead = null;

  if(outcome.error !== null) {
    throw outcome.error;
  }
  if(outcome.result.status == 'stall') {
    await usbDevice.clearHalt('in', usbRxEndpoint);
    return new Uint8Array();
  }
  if((outcome.result.status != 'ok') || (outcome.result.data === undefined)) {
    return new Uint8Array();
  }

  const data = outcome.result.data;
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
}

// Throw away everything that has been received but has not been read yet
async function usbDiscardReceived() {
  const endTime = performance.now() + 500; // do not get stuck here in a noisy environment
  while((await usbReadPacket(20) !== null) && (performance.now() < endTime)) {
    // nothing to do with the stale data
  }
}

/**
 * Collect the bytes of a reply: wait for the first bytes to arrive within the timeout,
 * then read on until no more bytes arrive.
 */
async function usbReadReply(timeout) {
  let rxMsg = new Uint8Array();
  const startTime = performance.now();
  const endTime = startTime + timeout + 2000; // upper limit, even when bytes keep on coming in

  while(performance.now() < endTime) {
    let packetTimeout = USB_QUIET_TIME;
    if(rxMsg.length == 0) {
      packetTimeout = startTime + timeout - performance.now();
      if(packetTimeout <= 0) {
        break;
      }
    }

    const packet = await usbReadPacket(packetTimeout);
    if(packet === null) {
      break;
    }
    rxMsg = concatBuffers(rxMsg, packet);
  }

  return rxMsg;
}

/**
 * Search the received bytes for a valid reply to the command with the given opcode.
 * Returns the reply payload or null.
 */
function usbExtractReply(rxMsg, opcode) {
  // a reply starts with the complement of the command's opcode, followed by the opcode itself;
  // the preamble in front of it is not needed to find it (and its first bytes get lost every now and then)
  const replyOpcode = (~opcode) & 0xFF;

  for(let start = 0; start + 1 < rxMsg.length; start++) {
    if((rxMsg[start] == replyOpcode) && (rxMsg[start + 1] == opcode)) {
      const reply = extractReply(concatBuffers(preamble, rxMsg.slice(start)), true);
      if(reply.valid) {
        return reply.payload;
      }
    }
  }

  return null;
}

async function usbTransceiveCommand(opcode, params = new Uint8Array(), timeout = 400, ignoreReply = false) {
    const txMsg = encodeCommand(opcode, params);

    if(txMsg.length == 0) {
        console.log("[TXM] encoding error, wrong number of parameters");
        return {success: false, payload: null};
    }
    if(txMsg.length < preamble.length) {
        return {success: false, payload: null};
    }
    opcode = txMsg[preamble.length]; // take opcode from transmit messages as toggle bit may have been set

    if((usbDevice === null) || !usbDevice.opened) {
        console.log("[TXM] USB tower is not connected");
        return {success: false, payload: null};
    }

    // Time to wait for the reply to begin: flight time of the command plus the given timeout.
    const replyTimeout = txMsg.length * USB_IR_BYTE_TIME + timeout;

    try {
        // When there's no valid reply, the very same message is sent again. The RCX detects the repetition
        // (same opcode including the toggle bit) and replies again without executing the command twice.
        const maxAttempts = ignoreReply ? 1 : USB_MAX_ATTEMPTS;
        for(let attempt = 1; attempt <= maxAttempts; attempt++) {
            await usbDiscardReceived();

            console.log("[TXM]", array2hex(txMsg));
            const result = await usbDevice.transferOut(usbTxEndpoint, txMsg);
            if((result.status != 'ok') || (result.bytesWritten != txMsg.length)) {
                console.log("[TXM] USB OUT transfer failed: " + result.status);
                if(result.status == 'stall') {
                    await usbDevice.clearHalt('out', usbTxEndpoint);
                }
                continue;
            }

            // unlike the serial tower, the USB tower does not echo: everything received is from the RCX
            const rxMsg = await usbReadReply(replyTimeout);
            console.log("[RXM]", array2hex(rxMsg));

            if(ignoreReply) {
                console.log("[RPL] ignoring reply");
                return {success: true, payload: null};
            }

            const payload = usbExtractReply(rxMsg, opcode);
            if(payload !== null) {
                console.log("[RPL] valid? true, payload: " + array2hex(payload));
                console.log("[CMD] success");
                return {success: true, payload: payload};
            }
            console.log("[RPL] no valid reply (attempt " + attempt + " of " + maxAttempts + ")");
        }
    }
    catch(e) {
        console.log("[CMD] USB transfer error: " + e.message);
        showErrorMsg("USB transfer failed: '" + e.message + "'");
    }

    return {success: false, payload: null};
}

/**
 * @name Disconnect USB device
 * Closes the WebUSB connection.
 */
async function usbDisconnect(quiet=false) {
  if(usbDevice !== null) {
    try {
      if(usbDevice.opened) {
        await usbDevice.close(); // also releases the claimed interface and aborts a pending IN transfer
      }
    }
    catch(e) {
      console.log("Error while closing USB device: " + e.message);
    }
  }

  usbDevice = null;
  usbTxEndpoint = null;
  usbRxEndpoint = null;
  usbPendingRead = null;

  if(!quiet) {
    showInfoMsg("Disconnected from USB tower.");
  }
  return true;
}
