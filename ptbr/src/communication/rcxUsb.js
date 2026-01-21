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
//  The USB device
// - is compliant with USB version 1.1,
// - has two interrupt endpoints,
//   (endpoint 1 is used for device-to-host communications,
//    endpoint 2 is used for host-to-device communications)
// - implements a vendor-specific device class (no HID or other USB class standards).
// There's an official document from TLG called "LEGO USB Tower Interface Reference" which
// describes the vendor-specific requests.

let usbDevice;
let usbTxEndpoint;
let usbRxEndpoint;

// Helper to sleep, i.e. add delay
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// define various control elements
const log = document.getElementById('logArea');
const butUsbConnect = document.getElementById('usbConnectBtn');
const butFwDownload = document.getElementById('downloadFirmwareBtn');

document.addEventListener('DOMContentLoaded', () => {
  butUsbConnect.addEventListener('click', clickUsbConnect);
  butFwDownload.addEventListener('click', clickFwDownload);
});

const USB_VENDOR_ID = 0x0694;
const USB_PRODUCT_ID = 0x0001;
const USB_DEV_CONFIG_ID = 1;
const USB_INTERFACE_ID = 0;

function showErrorMsg(msg) {
    log.value += "❌️ " + msg + "\n";
}

function showInfoMsg(msg) {
    log.value += msg + "\n";
}

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
const LTW_REQ_GET_RX_SPEED = 0xF2; // get IR receive speed
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


// parameter IDs (used as LOBYTE part of the 2 byte wValue)
const LTW_PARM_MODE = 0x01; // tower mode
const LTW_PARM_RANGE = 0x02; // transmission range: Short, Medium (default) or Long
const LTW_PARM_ERRDETECT = 0x03; // error detection on IR receiver
const LTW_PARM_ERRSTATUS = 0x04; // current internal error status of the tower (default: no error)
const LTW_PARM_ENDIAN = 0x97; // vendor request word format: Little Endian (PC/Windows standard; default) or Big Endian (Apple/Motorola standard)
const LTW_PARM_ID_LED_MODE = 0x98; // Indicator LED control: Firmware-controlled (default) or Host controlled
const LTW_PARM_ERROR_SIGNAL = 0x99; // Signal indicator LED on when serious internal error occurs: On (default)/Off
// const LTW_PARM_IRC_PACKETSIZE = ... // Packet size (in bytes) for Infrared Remote Control (IRC) protocol for LEGO cars
// const LTW_PARM_IRC_DELAY_TX = ... // Transmit delay (in ms) in between IRC packets

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

  // Calling the requestDevice() method triggers the user agent's pairing flow.
  // It returns a Promise that resolves with an instance of USBDevice if the specified device is found.
  usbDevice = await navigator.usb.requestDevice({ filters: [{ vendorId: USB_VENDOR_ID, productId: USB_PRODUCT_ID }] });
  usbTxEndpoint = null;
  usbRxEndpoint = null;

  console.log("Manufacturer name:     " + usbDevice.manufacturerName);
  console.log("Product name:          " + usbDevice.productName);
  console.log("Device class:          0x" + usbDevice.deviceClass.toString(16).toUpperCase().padStart(2, "0"));
  console.log("Number of device configurations: " + usbDevice.configurations.length);

  let success = true;

  // Check for known USB descriptor values
  if((usbDevice.manufacturerName == "LEGO Group") &&
     (usbDevice.productName == "LEGO USB Tower") &&
     (usbDevice.deviceClass == 255) &&
     (usbDevice.configurations.length == 4)) {

      await usbDevice.open(); // Begin a session.

      success = usbDevice.opened;

      if(!success) {
        showErrorMsg("Não foi possível se conectar ao dispositivo USB.");
      }
  }
  else {
    showErrorMsg("Valor inesperado de descritor USB recebido.");
    success = false;
  }

  if(success)
  {
      showInfoMsg("Dispositivo USB conectado com sucesso.");

      version = await getUsbTowerFwVersion();

      if(version != "") {
        showInfoMsg("🔗 Versão do firmware da torre USB é '" + version + "'.");

        success = await resetUsbTower();

        if(!success) {
            showErrorMsg("UNão foi possível reiniciar a torre USB.");
        }

        statisticsSuccess = await getStatistics();
        if(!statisticsSuccess) {
            showErrorMsg("Unable to receive IR tower statistics.");
        }
      }
      else {
        showErrorMsg("Não foi possível ler a versão do firmware da torre USB.");
        success = false;
      }
  }

    if(success) {
        showInfoMsg("🔗 A torre USB foi reiniciada. Comunicação com a torre USB funcionando!");

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
            showErrorMsg("Não foi possível selecionar a configuração.");
        }
    }

    if(success) {
        showInfoMsg("🔗 Selecionado a configuração do dispositivo USB #" + USB_DEV_CONFIG_ID);

        await usbDevice.claimInterface(USB_INTERFACE_ID);
        success = ((usbDevice.configuration.interfaces[USB_INTERFACE_ID].interfaceNumber == USB_INTERFACE_ID) &&
                   (usbDevice.configuration.interfaces[USB_INTERFACE_ID].claimed));

        if(!success) {
            showErrorMsg("Não foi possível obter esta interface.");
        }
    }

    // It's possible to set speeds for RX and TX independently, but we go for 2400 baud in both directions.
    const rxTxSpeed = SPEED_COMM_BAUD_2400;
    if(success) {
        showInfoMsg("🔗 Interface USB selecionada #" + USB_INTERFACE_ID);

/*
        success = await setUsbTowerTxSpeed(rxTxSpeed);
        if(!success) {
            showErrorMsg("Não foi possível definir a velocidade TX.");
        }
*/
    }

/*
    if(success) {
        showInfoMsg("🔗 Definir velocidade TX.");

        success = await setUsbTowerRxSpeed(rxTxSpeed);
        if(!success) {
          showErrorMsg("Não foi possível definir a velocidade RX.");
        }
    }
*/

    if(success) {
        showInfoMsg("🔗 Definir velocidade RX.");

        usbTxEndpoint = usbDevice.configuration.interfaces[USB_INTERFACE_ID].alternate.endpoints.find(obj => obj.direction === 'out').endpointNumber;
        usbRxEndpoint = usbDevice.configuration.interfaces[USB_INTERFACE_ID].alternate.endpoints.find(obj => obj.direction === 'in').endpointNumber;
        showInfoMsg("🔗 TX ponto final é #" + usbTxEndpoint + ", RX ponto final é #" + usbRxEndpoint);

        success = await flushUsbTowerBuffers(true, true);

        if(!success) {
            showErrorMsg("Não é possível esvaziar os buffers da torre USB.");
        }
        else {
            // try again
            do {
              success = await ping();

              statisticsSuccess = await getStatistics();
              if(!statisticsSuccess) {
                  showErrorMsg("Unable to receive IR tower statistics.");
              }
            } while (!success);
        }
    }

    if(!success) {
        showErrorMsg("Nenhuma comunicação possível com o RCX.\n" +
                     "O RCX precisa ser ligado e colocado próximo à torre Infra Vermelho e também precisa estar na linha de visão.\n" +
                     "Por favor tente novamente.");
    }

    if(success) {
        showInfoMsg("🔗 Comunicação funcionando, RCX está respondendo!");

        versionInfo = await getVersions();
        if(!versionInfo.success) {
            showErrorMsg("Não foi possível obter a versão da ROM e firmware.");
            success = false;
        }
    }

    if(success) {
        showInfoMsg("ℹ️ versão da ROM: " + versionInfo.romVersion + ", versão do Firmware: " + versionInfo.fwVersion);
        if(versionInfo.fwVersion == '0.0') {
            showErrorMsg("A versão de firmware '0.0' indica que atualmente nenhum firmware está carregado na memória RAM.");
            success = false;
        }
    }

/*
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
*/

    return success;
}

async function getStatistics() {
  // request statistics from IR tower
  const setup = {requestType: "vendor", recipient: "device", request: LTW_REQ_GET_STAT, value: 0, index: 0};
  const length = 12;

  let result = await usbDevice.controlTransferIn(setup, length);
  let success = true;

  if(result.status == 'ok') {
    const statReply = new Uint8Array(result.data.buffer);
    const size = to16bit(statReply, false);

    if(size == 12) {
      const errCode = statReply[2];
      if(errCode == 0) {
        const rxByteCount = to16bit(statReply, false, 4);
        const overrunErrCount = to16bit(statReply, false, 6);
        const noiseCount = to16bit(statReply, false, 8);
        const frameErrCount = to16bit(statReply, false, 10);
        console.log(rxByteCount + " bytes received, " + overrunErrCount + " overruns, " +
          noiseCount + " wrong bits (noise), " + frameErrCount + " frame errors");
      }
      else {
        success = false;
        console.log("Error code: " + errorCodeToString(errCode));
      }
    } else {
      success = false;
    }
  } else {
    success = false;
  }

  return success;
}

async function getUsbTowerFwVersion() {
  // request firmware version
  const setup = {requestType: "vendor", recipient: "device", request: LTW_REQ_GET_VERSION, value: 0, index: 0};
  const length = 8;

  let result = await usbDevice.controlTransferIn(setup, length);
  let version = "";

  if(result.status == 'ok') {
    const versionReply = new Uint8Array(result.data.buffer);
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
  const setup = {requestType: "vendor", recipient: "device", request: LTW_REQ_RESET, value: 0, index: 0};
  const length = 4;

  let result = await usbDevice.controlTransferIn(setup, length);
  let success = true;

  if(result.status == 'ok') {
    const resetReply = new Uint8Array(result.data.buffer);
    const size = to16bit(resetReply, false);

    if(size == 4) {
      const errCode = resetReply[2];
      if(errCode == 0) {
        console.log("reinicio realizado.");
      }
      else {
        console.log("código de erro: " + errCode);
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
  const result = await usbDevice.controlTransferIn(setup, length);

  let success = true;

  if(result.status == 'ok') {
    const reply = new Uint8Array(result.data.buffer);
    const size = to16bit(reply, false);

    if(size == 6) {
      const errCode = reply[2];
      if(errCode == 0) {
        const value = reply[3];
        const speedResponse = to16bit(reply, false, 4);
        success = ((value == 0) && (speedResponse == SPEED_COMM_BAUD_2400));
        console.log("Definir velocidade TX.");
      }
      else {
        console.log("Código de erro: " + errorCodeToString(errCode));
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
    const reply = new Uint8Array(result.data.buffer);
    const size = to16bit(reply, false);

    if(size == 6) {
      const errCode = reply[2];
      if(errCode == 0) {
        const value = reply[3];
        const speedResponse = to16bit(reply, false, 4);
        success = ((value == 0) && (speed == SPEED_COMM_BAUD_2400));
        console.log("Definir velocidade RX to #" + speedResponse + ".");
      }
      else {
        console.log("Código de erro: " + errorCodeToString(errCode));
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
          console.log("TX está pronto.");
        }
        else {
          console.log("TX está ocupado.");
        }
      }
      else {
        console.log("Código de erro: " + errorCodeToString(errCode));
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
        console.log("Limpado os buffers: " + array2hex([flushedBuffers]));
      }
      else {
        console.log("Código de erro: " + errorCodeToString(errCode));
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

async function remoteSound() {
    params = new Uint8Array([0x00, 0x00]);
    let {success, payload} = await transceiveCommand(OpCode.RemoteCommand, params);

    if(success) {
        params = new Uint8Array([0x80, 0x00]);
        let {success, payload} = await transceiveCommand(OpCode.RemoteCommand, params);
    }

    return success;
}

async function transceiveCommand(opcode, params = new Uint8Array(), timeout = 500, ignoreReply = false) {
    const txMsg = encodeCommand(opcode, params);

    if(txMsg.length == 0) {
        console.log("[TXM] erro de codificação, número errado de parâmetros");
        return {success: false, payload: null};
    }
    if(txMsg.length < preamble.length) {
        return {success: false, payload: null};
    }

    success = await isTxReady();

    if(!success) {
        showErrorMsg("Não consigo colocar o estado do TX ou o TX não está pronto.");
    }
    else {
        //await flushUsbTowerBuffers(false, true);

        console.log("[TXM]", array2hex(txMsg));
        let result = await usbDevice.transferOut(usbTxEndpoint, txMsg);

        success = (result.status == 'ok') && (result.bytesWritten == txMsg.length);
    }

    let rxMsg = new Uint8Array([]);
    let valid = false;
    let reply;
    let failedInXfers = 0; // count number of failed USB in transfers
    let successfulInXfers = 0; // count number of successful USB in transfers
    const maxFailedInXfers = 50;

    if(success) {
        console.log("OUT transfer successful.");

        while(!valid && (failedInXfers < maxFailedInXfers)) {
            let inXferSuccess;
            try {
                let usbInRequest = Promise.race([
                  usbDevice.transferIn(usbRxEndpoint, 8),
                  new Promise((resolve, reject) => {
                    setTimeout(() => reject(), 50);
                  }),
                ]);
                result = await usbInRequest;
                inXferSuccess = (result.status == 'ok');
                if(inXferSuccess) {
                    successfulInXfers++;
                }
            }
            catch(e) {
                inXferSuccess = false;
                failedInXfers++;
            }

            // check if the single transfer has succeeded
            if(inXferSuccess) {
                rxMsg = concatBuffers(rxMsg, result.data.buffer);

                if(rxMsg.length >= 2 && rxMsg[0] == 0xFF && rxMsg[1] == 0x00) {
                    console.log("Auto-fixing corrupt prefix: missing 0x55 but seeing 0xFF and 0x00");
                    rxMsg = concatBuffers(new Uint8Array([0x55]), rxMsg);
                }
                else if(rxMsg.length >= 1 && rxMsg[0] == 0x00) {
                    console.log("Auto-fixing corrupt prefix: missing 0x55 and 0xFF but seeing 0x00");
                    rxMsg = concatBuffers(new Uint8Array([0x55, 0xFF]), rxMsg);
                }

                reply = extractReply(rxMsg, quiet=true);
                valid = reply.valid; // we are done, let's leave the loop!
            }
        }

        console.log("Number of successful IN transfers: " + successfulInXfers)
        console.log("Number of failed IN transfers: " + failedInXfers)
    }
    else {
        console.log("Failed to transfer OUT.");
    }

    if(success && valid) {
        console.log("Both OUT and IN transfers successful.");
        console.log("[RXM]", array2hex(rxMsg));
        console.log("[Reply]", array2hex(reply.payload));
        console.log("[Reply Validity]", reply.valid);

        return {success: true, payload: reply.payload};
    }
    else {
        console.log("Unable to transceive.");
        if(rxMsg.length > 0)
        {
            console.log("[RXM]", array2hex(rxMsg));
            if(reply !== undefined) {
                console.log("[Reply]", array2hex(reply.payload));
                console.log("[Reply Validity]", reply.valid);
            }
        }

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

// Handler for click on firmware download button
async function clickFwDownload() {
    // Open a dialog first to let the user confirm the download before starting it
    const confirmedFwDownload = window.confirm("O download do firmware é bem lento e leva vários minutos. " +
        "O download do firmware pode falhar. Você precisará reinstalar o firmware caso isto aconteça." +
        "\n\nEu sei o que estou fazendo e quero continuar.");

    if(confirmedFwDownload) {
        console.log("Solicitação de download de firmware confirmada.");
        showInfoMsg("Solicitação de download de firmware confirmada.");

        const success = await downloadFirmware();
        if(success) {
            showInfoMsg("âœ… Download do Firmware completo. ðŸŽ‰");
        }
        else {
            showErrorMsg("Falha ao baixar o firmware. Certifique-se de que o RCX está ligado " +
                "e na linha de visão da torre infra vermelho. Por favor, tente novamente!");
        }
        showInfoMsg("Por favor, desconecte e reconecte!");
    }
    else {
        console.log("Solicitação de download de firmware abortada.");
        showInfoMsg("Solicitação de download de firmware abortada.");
    }
}
