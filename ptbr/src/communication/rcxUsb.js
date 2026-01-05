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
const butFwDownload = document.getElementById('downloadFirmwareBtn');

document.addEventListener('DOMContentLoaded', () => {
  butUsbConnect.addEventListener('click', clickUsbConnect);
  butFwDownload.addEventListener('click', clickFwDownload);
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
     (usbDevice.productName == "LEGO Torre USB") &&
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
            showErrorMsg("Não foi possível reiniciar a torre USB.");
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

        success = await setUsbTowerTxSpeed(rxTxSpeed);
        if(!success) {
            showErrorMsg("Não foi possível definir a velocidade TX.");
        }
    }

    if(success) {
        showInfoMsg("🔗 Definir velocidade TX.");

        success = await setUsbTowerRxSpeed(rxTxSpeed);
        if(!success) {
            showErrorMsg("Não foi possível definir a velocidade RX.");
        }
    }

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
            success = await ping();
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
    reply = new Uint8Array(result.data.buffer);
    const size = to16bit(reply, false);

    if(size == 6) {
      const errCode = reply[2];
      if(errCode == 0) {
        const value = reply[3];
        const speed = to16bit(reply, false, 4);
        success = ((value == 0) && (speed == SPEED_COMM_BAUD_2400));
        console.log("Definir velocidade RX.");
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
        // console.log("OUT transfer successful.");

        while(!valid && (failedInXfers < maxFailedInXfers)) {
            let inXferSuccess;
            try {
                const usbInRequest = Promise.race([
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
