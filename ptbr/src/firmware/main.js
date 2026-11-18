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
const usbConnectBtn = document.getElementById('usbConnectBtn');
const downloadFirmwareBtn = document.getElementById('downloadFirmwareBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const logArea = document.getElementById('logArea');
const fastDownloadCb = document.getElementById('fastDownloadCb');

let serialConnected = false;
let usbConnected = false;

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
    console.log("Web Serial não suportado.");
    disableSerialConnectBtn();
  }

  const webUsbNotSupported = document.getElementById('webusb-not-supported');
  if(!('usb' in navigator)) {
    // show hidden error banner, deactivate connect button and log to console
    webUsbNotSupported.style.display = "block";
    console.log("WebUSB não suportado.");
    disableUsbConnectBtn();
  }

  const wasmNotSupported = document.getElementById('wasm-not-supported');
  if(!wasmSupported) {
    // show hidden error banner, deactivate connect button and log to console
    wasmNotSupported.style.display = "bloco";
    console.log("WebAssembly (WASM) não suportado.");
    disableCompileBtn();
  }

  serialConnectBtn.addEventListener('click', clickSerialConnect);
  usbConnectBtn.addEventListener('click', clickUsbConnect);
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

function disableUsbConnectBtn() {
  usbConnectBtn.disabled = true; // Disable USB connection button
  usbConnectBtn.style.color = 'gray'; // Change text color to indicate missing functionality support
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
        showErrorMsg("Não foi possível se comunicar com o bloco RCX.\n" +
               "O bloco RCX precisa estar ligado e posicionado próximo à torre IR e também em linha de visão.\n" +
               "Por favor, tente novamente.");
      } else {
        showInfoMsg("🔗 Comunicação funcionando, RCX está respondendo!");

        fwVersion = await checkFirmware();

        if(fwVersion == null) {
            showErrorMsg("Não foi possível determinar a versão do firmware.");
        } else {
          if(fwVersion == '0.0') {
            showErrorMsg("A versão do firmware '0.0' indica que atualmente nenhum firmware está carregado na memória RAM. " +
              "Download de programas para o RCX não é possível. É bom que você esteja aqui!");
            // will work anyways, because that's why they're here!
          }

          await checkBatteryLevel();

          enableDownloadFirmwareBtn();
          serialConnectBtn.innerHTML = '🔗 Desconectar Serial';
          serialConnected = true;
        }
      }
    }
  } else {
    success = await serialDisconnect();

    if(success) {
      disableDownloadFirmwareBtn();
      serialConnectBtn.innerHTML = '🔗 Conectar Serial';
      serialConnected = false;
    }
  }
}

/**
 * @name clickUsbConnect
 * Click handler for the USB connect/disconnect button.
 */
async function clickUsbConnect() {
  let success = true;

  if (!usbConnected) {
    if(serialConnected) {
      showErrorMsg("Já conectado pela torre serial. Por favor, desconecte primeiro.");
      return;
    }

    success = await usbConnect();

    if(success) {
      success = await ping();

      if(!success) {
        showErrorMsg("Não foi possível se comunicar com o bloco RCX.\n" +
               "O bloco RCX precisa estar ligado e posicionado próximo à torre IR e também em linha de visão.\n" +
               "Por favor, tente novamente.");
      } else {
        showInfoMsg("🔗 Comunicação funcionando, RCX está respondendo!");

        fwVersion = await checkFirmware();

        if(fwVersion == null) {
            showErrorMsg("Não foi possível determinar a versão do firmware.");
        } else {
          if(fwVersion == '0.0') {
            showErrorMsg("A versão do firmware '0.0' indica que atualmente nenhum firmware está carregado na memória RAM. " +
              "Download de programas para o RCX não é possível. É bom que você esteja aqui!");
            // will work anyways, because that's why they're here!
          }

          await checkBatteryLevel();

          enableDownloadFirmwareBtn();
          usbConnectBtn.innerHTML = '🔗 Desconectar USB';
          usbConnected = true;
          disableSerialConnectBtn(); // only one IR tower at a time
        }
      }

      if(!usbConnected) {
        // give the tower back, so that the next attempt starts from scratch
        await usbDisconnect(true);
      }
    }
  } else {
    success = await usbDisconnect();

    if(success) {
      disableDownloadFirmwareBtn();
      usbConnectBtn.innerHTML = '🔗 Conectar USB';
      usbConnected = false;
      if('serial' in navigator) {
        enableSerialConnectBtn();
      }
    }
  }
}

// Handler for click on firmware download button
async function clickFwDownload() {
  // Open a dialog first to let the user confirm the download before starting it
  const confirmedFwDownload = window.confirm("O dowload do firmware é lento, e levará diversos minutos. (+ ou - 7 minutos) " +
    "O download do firmware pode falhar. Pode tornar seu RCX (temporariamente) inutilizável." +
    "\n\nEu sei o que estou fazendo e quero continuar.");

  if(confirmedFwDownload) {
    console.log("Pedido para baixar o firmware confirmado.");
    showInfoMsg("Pedido para baixar o firmware confirmado.");

    // TODO: add mechanism to choose between different firmware versions

    let firmwareName = "RCX firmware";
    if(fastDownloadCb.checked && fastDownloadSupported()) {
      // quad-rate download via firmdl3's fast download stub
      success = await downloadFirmwareFast(firmwareName, firm0332Data, firmdl3FastdlStubData);
    } else {
      success = await downloadFirmware(firmwareName, firm0332Data);
    }

    if(success) {
      showInfoMsg("✅ " + capitalize(firmwareName) + " download completo. 🎉");
    }

    if(!success) {
        showErrorMsg("Falha ao baixar o firmware. Certifique-se de que o RCX está ligado " +
            "e dentro da linha de visão da torre IR. Por favor, tente novamente!");
    }

    showInfoMsg("Por favor, desconecte e reconecte!");
  } else {
      console.log("Pedido para baixar o firmware abortado.");
      showInfoMsg("Pedido para baixar o firmware abortado.");
  }
}
