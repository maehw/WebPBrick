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

// This JavaScript code is used for serial communication with the RCX programmable brick via a LEGO USB IR Tower.

let usbDevice;
let usbTxEndpoint;
let usbRxEndpoint;

// Helper to sleep, i.e. add delay
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// define various control elements
const log = document.getElementById('logArea');
const butUsbConnect = document.getElementById('usbConnectBtn');

document.addEventListener('DOMContentLoaded', () => {
  butUsbConnect.addEventListener('click', clickUsbConnect);
});

const USB_VENDOR_ID = 0x0694;
const USB_PRODUCT_ID = 0x0001;
const USB_DEV_CONFIG_ID = 2;
const USB_INTERFACE_ID = 0;

function showErrorMsg(msg) {
    log.value += "❌️ " + msg + "\n";
}

function showInfoMsg(msg) {
    log.value += msg + "\n";
}

// vendor request IDs
const LTW_REQ_GET_PARM = 0x01;
const LTW_REQ_SET_PARM = 0x02;
const LTW_REQ_FLUSH = 0x03;
const LTW_REQ_SET_TX_SPEED = 0xEF;
const LTW_REQ_SET_RX_SPEED = 0xF1;
const LTW_REQ_GET_TX_STATE = 0xF2;
const LTW_REQ_GET_COPYRIGHT = 0xFE;
const LTW_REQ_GET_CREDITS = 0xFF;

// error codes
const LTW_REQERR_SUCCESS = 0x00;
const LTW_REQERR_BADPARM = 0x01;
const LTW_REQERR_BUSY = 0x02;
const LTW_REQERR_NOPOWER = 0x03;
const LTW_REQERR_WRONGMODE = 0x04;
const LTW_INTERNAL_ERROR = 0xFE;
const LTW_REQERR_BADREQUEST = 0xFF;


// parameter IDs
const LTW_PARM_MODE = 0x01; // tower mode
const LTW_PARM_RANGE = 0x02; // transmission range: Short, Medium (default) or Long
const LTW_PARM_ERRDETECT = 0x03; // error detection on IR receiver
const LTW_PARM_ERRSTATUS = 0x04; // Current internal error status of the tower (default: no error)
const LTW_PARM_ENDIAN = 0x97; // Vendor request word format: Little Endian (PC/Windows standard; default) or Big Endian (Apple/Motorola standard)
const LTW_PARM_ID_LED_MODE = 0x98; // Indicator LED control: Firmware-controlled (default) or Host controlled
const LTW_PARM_ERROR_SIGNAL = 0x99; // Signal indicator LED on when serious internal error occurs: On (default)/Off

// parameter value IDs
const SPEED_COMM_BAUD_1200 = 0x0004;
const SPEED_COMM_BAUD_2400 = 0x0008;
const SPEED_COMM_BAUD_4800 = 0x0010;
const SPEED_COMM_BAUD_9600 = 0x0020;
const SPEED_COMM_BAUD_19200 = 0x0040;

// Helper to convert two bytes (8 bit each) to a single 16-bit word
function to16bit(payload, highLow, offset=0) {
    if(payload.constructor != Uint8Array) {
        return null;
    }

    if(highLow) {
        return ((payload[0+offset] & 0xFF) << 8) | (payload[1+offset] & 0xFF);
    }
    else {
        return ((payload[1+offset] & 0xFF) << 8) | (payload[0+offset] & 0xFF);
    }
}

function errorCodeToString(errCode) {
    let str = null;
    switch(errCode) {
        case LTW_REQERR_SUCCESS:
            str = "LTW_REQERR_SUCCESS";
            break;
        case LTW_REQERR_BADPARM:
            str = "LTW_REQERR_BADPARM";
            break;
        case LTW_REQERR_BADPARM:
            str = "LTW_REQERR_BADPARM";
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
 * @name clickUsbConnect
 * Click handler for the connect/disconnect button.
 */
async function clickUsbConnect() {
  // Disconnect
  if (usbDevice) {
    await usbDisconnect();
    return;
  }

  // Connect
  await usbConnect();
}

/**
 * @name Connect USB device
 * Opens a WebUSB connection to an RCX programmable brick
 */
async function usbConnect() {
  // Request a USB device and open a connection.

  // dive deeper?
  // https://hackernoon.com/exploring-the-webusb-api-connecting-to-usb-devices-and-printing-with-tspltspl2
  usbDevice = await navigator.usb.requestDevice({ filters: [{ vendorId: USB_VENDOR_ID, productId: USB_PRODUCT_ID }] });
  usbTxEndpoint = null;
  usbRxEndpoint = null;

  console.log("Manufacturer name:     " + usbDevice.manufacturerName);
  console.log("Product name:          " + usbDevice.productName);
  console.log("Device class:          0x" + usbDevice.deviceClass.toString(16).toUpperCase().padStart(2, "0"));
  console.log("Number of device configurations: " + usbDevice.configurations.length);

  let success = true;

  if((usbDevice.manufacturerName == "LEGO Group") &&
     (usbDevice.productName == "LEGO USB Tower") &&
     (usbDevice.deviceClass == 255) &&
     (usbDevice.configurations.length == 4)) {

      await usbDevice.open(); // Begin a session.

      success = usbDevice.opened;

      if(!success) {
        showErrorMsg("Unable to open USB device.");
      }
  }
  else {
    showErrorMsg("Unexpected USB descriptor values.");
    success = false;
  }

  if(success)
  {
      showInfoMsg("Opened USB device successfully.");

      version = await getUsbTowerFwVersion();

      if(version != "") {
        showInfoMsg("🔗 USB tower firmware version is '" + version + "'.");

        success = await resetUsbTower();

        if(!success) {
            showErrorMsg("Unable to reset USB tower.");
        }
      }
      else {
        showErrorMsg("Unable to read firmware version from USB tower.");
        success = false;
      }
  }

    if(success) {
        showInfoMsg("🔗 Performed USB tower reset. Communication with USB tower working!");

        // The Tower has four USB configurations:
        // 1. Low power (default)
        // 2. High power
        // 3. Low power, low bandwidth (8 ms polling interval)
        // 4. High power, low bandwith(sic!) (8 ms polling interval)
        //return device.selectConfiguration(0);  // fails, configurations have indexes 1..4
        //let configValue1 = usbDevice.configuration.configurationValue;
        await usbDevice.selectConfiguration(USB_DEV_CONFIG_ID);
        success = (usbDevice.configuration !== null) && (usbDevice.configuration.configurationValue == USB_DEV_CONFIG_ID);

        if(!success) {
            showErrorMsg("Unable to select configuration.");
        }
    }

    if(success) {
        showInfoMsg("🔗 Selected USB device configuration #" + USB_DEV_CONFIG_ID);

        await usbDevice.claimInterface(USB_INTERFACE_ID);
        success = ((usbDevice.configuration.interfaces[USB_INTERFACE_ID].interfaceNumber == USB_INTERFACE_ID) &&
                   (usbDevice.configuration.interfaces[USB_INTERFACE_ID].claimed));

        if(!success) {
            showErrorMsg("Unable to claim interface.");
        }
    }

    // It's possible to set speeds for RX and TX independently, but we go for 2400 baud in both directions.
    const rxTxSpeed = SPEED_COMM_BAUD_2400;
    if(success) {
        showInfoMsg("🔗 Selected USB interface #" + USB_INTERFACE_ID);

        success = await setUsbTowerTxSpeed(rxTxSpeed);
        if(!success) {
            showErrorMsg("Unable to set TX speed.");
        }
    }

    if(success) {
        showInfoMsg("🔗 Set TX speed.");

        success = await setUsbTowerRxSpeed(rxTxSpeed);
        if(!success) {
            showErrorMsg("Unable to set RX speed.");
        }
    }

    if(success) {
        showInfoMsg("🔗 Set RX speed.");

        usbTxEndpoint = usbDevice.configuration.interfaces[USB_INTERFACE_ID].alternate.endpoints.find(obj => obj.direction === 'out').endpointNumber;
        usbRxEndpoint = usbDevice.configuration.interfaces[USB_INTERFACE_ID].alternate.endpoints.find(obj => obj.direction === 'in').endpointNumber;
        showInfoMsg("🔗 TX endpoint is #" + usbTxEndpoint + ", RX endpoint is #" + usbRxEndpoint);

        success = await flushUsbTowerBuffers(true, true);

        if(!success) {
            showErrorMsg("Unable to flush USB tower's buffers.");
        }
    }

    if(success) {
        success = await ping();
        if(!success) {
            showErrorMsg("Unable to ping.");
        }
    }

    if(success) {
        success = await playSystemSound(SystemSound.Beep);

        if(!success) {
            showErrorMsg("Unable to play system sound.");
        }
    }
    if(success) {
        showInfoMsg("🎵 Played system sound.");
    }

    return success;
}

async function getUsbTowerFwVersion() {
  // request firmware version
  const GET_VERSION_REQUEST = 0xFD;
  const setup = {requestType: "vendor", recipient: "device", request: GET_VERSION_REQUEST, value: 0, index: 0};
  const length = 8;

  result = await usbDevice.controlTransferIn(setup, length);
  let version = "";

  if(result.status == 'ok') {
    versionReply = new Uint8Array(result.data.buffer);
    const size = to16bit(versionReply, false);

    if(size == 8) {
      const errCode = versionReply[2];
      if(errCode == 0) {
        const majorVersion = versionReply[4];
        const minorVersion = versionReply[5];
        const buildNoVersion = to16bit(versionReply, false, 6);
        version = majorVersion + "." + minorVersion + " build " + buildNoVersion;
      }
      else {
        console.log("Error code: " + errorCodeToString(errCode));
      }
    }
  }

  return version;
}

async function resetUsbTower() {
  // request reset (green LED should light up)
  const RESET_REQUEST = 0x04;
  const setup = {requestType: "vendor", recipient: "device", request: RESET_REQUEST, value: 0, index: 0};
  const length = 4;

  result = await usbDevice.controlTransferIn(setup, length);
  let success = true;

  if(result.status == 'ok') {
    versionReply = new Uint8Array(result.data.buffer);
    const size = to16bit(versionReply, false);

    if(size == 4) {
      const errCode = versionReply[2];
      if(errCode == 0) {
        console.log("Performed reset.");
      }
      else {
        console.log("Error code: " + errCode);
        success = false;
      }
    }
    else {
        success = false;
    }
  }
  else {
    success = false;
  }

  return success;
}

async function setUsbTowerTxSpeed(speed) {
  // request to set TX speed
  const setup = {requestType: "vendor", recipient: "device", request: LTW_REQ_SET_TX_SPEED, value: speed, index: 0};
  const length = 6;
  result = await usbDevice.controlTransferIn(setup, length);

  let success = true;

  if(result.status == 'ok') {
    reply = new Uint8Array(result.data.buffer);
    const size = to16bit(reply, false);

    if(size == 6) {
      const errCode = reply[2];
      if(errCode == 0) {
        const value = reply[3];
        const speed = to16bit(reply, false, 4);
        success = ((value == 0) && (speed == SPEED_COMM_BAUD_2400));
        console.log("Set TX speed.");
      }
      else {
        console.log("Error code: " + errorCodeToString(errCode));
        success = false;
      }
    }
    else {
        success = false;
    }
  }
  else {
    success = false;
  }

  return success;
}

async function setUsbTowerRxSpeed(speed) {
  // request to set RX speed
  const setup = {requestType: "vendor", recipient: "device", request: LTW_REQ_SET_RX_SPEED, value: speed, index: 0};
  const length = 6;
  result = await usbDevice.controlTransferIn(setup, length);

  let success = true;

  if(result.status == 'ok') {
    reply = new Uint8Array(result.data.buffer);
    const size = to16bit(reply, false);

    if(size == 6) {
      const errCode = reply[2];
      if(errCode == 0) {
        const value = reply[3];
        const speed = to16bit(reply, false, 4);
        success = ((value == 0) && (speed == SPEED_COMM_BAUD_2400));
        console.log("Set RX speed.");
      }
      else {
        console.log("Error code: " + errorCodeToString(errCode));
        success = false;
      }
    }
    else {
        success = false;
    }
  }
  else {
    success = false;
  }

  return success;
}

async function isTxReady() {
  // request to TX state
  const setup = {requestType: "vendor", recipient: "device", request: LTW_REQ_GET_TX_STATE, value: 0, index: 0};
  const length = 6;
  result = await usbDevice.controlTransferIn(setup, length);

  let success = true;

  if(result.status == 'ok') {
    reply = new Uint8Array(result.data.buffer);
    const size = to16bit(reply, false);

    if(size == 6) {
      const errCode = reply[2];
      if(errCode == 0) {
        const txState = reply[4];
        success = (txState == 0x01);
        if(success) {
          console.log("TX is ready.");
        }
        else {
          console.log("TX is busy.");
        }
      }
      else {
        console.log("Error code: " + errorCodeToString(errCode));
        success = false;
      }
    }
    else {
        success = false;
    }
  }
  else {
    success = false;
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
  const setup = {requestType: "vendor", recipient: "device", request: LTW_REQ_FLUSH, value: selectedBuffers, index: 0};
  const length = 4;
  result = await usbDevice.controlTransferIn(setup, length);

  let success = true;

  if(result.status == 'ok') {
    reply = new Uint8Array(result.data.buffer);
    const size = to16bit(reply, false);

    if(size == 4) {
      const errCode = reply[2];
      if(errCode == 0) {
        const flushedBuffers = reply[3];
        console.log("Flushed buffers: " + array2hex([flushedBuffers]));
      }
      else {
        console.log("Error code: " + errorCodeToString(errCode));
        success = false;
      }
    }
    else {
        success = false;
    }
  }
  else {
    success = false;
  }

  return success;
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

    await sleep(50); // FIXME: delay where?

    success = await isTxReady();

    if(!success) {
        showErrorMsg("Unable to get TX state or TX not ready.");
    }
    else {
        await flushUsbTowerBuffers(false, true);

        console.log("[TXM]", array2hex(txMsg));
        let result = await usbDevice.transferOut(usbTxEndpoint, txMsg);

        success = (result.status == 'ok') && (result.bytesWritten == txMsg.length);
    }

    if(success) {
        console.log("Out transfer successful.");

        // try to read in (FIXME: make this work)
        const len = 4;
        result = await usbDevice.transferIn(usbRxEndpoint, len);

        success = (result.status == 'ok');

        if(!success) {
            console.log("Failed to transfer in.");
        }
    }
    else {
        console.log("Failed to transfer out.");
    }

    if(success) {
        showInfoMsg("IN transfer data: " + array2hex(result.data.buffer));

        return {success: true, payload: null};
    }
    else {
        return {success: false, payload: null};
    }
}

/**
 * @name Disconnect USB device
 * Closes the WebUSB connection.
 */
async function usbDisconnect() {
  if (usbDevice) {
    usbDevice = null;
  }
}

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
