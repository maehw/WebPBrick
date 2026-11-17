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
    console.log("Web Serial not supported.");
    disableSerialConnectBtn();
  }

  const webUsbNotSupported = document.getElementById('webusb-not-supported');
  if(!('usb' in navigator)) {
    // show hidden error banner, deactivate connect button and log to console
    webUsbNotSupported.style.display = "block";
    console.log("WebUSB not supported.");
    disableUsbConnectBtn();
  }

  const wasmNotSupported = document.getElementById('wasm-not-supported');
  if(!wasmSupported) {
    // show hidden error banner, deactivate connect button and log to console
    wasmNotSupported.style.display = "block";
    console.log("WebAssembly (WASM) not supported.");
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
 * @name clickUsbConnect
 * Click handler for the USB connect/disconnect button.
 */
async function clickUsbConnect() {
  let success = true;

  if (!usbConnected) {
    if(serialConnected) {
      showErrorMsg("Already connected via serial tower. Please disconnect first.");
      return;
    }

    success = await usbConnect();

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
          usbConnectBtn.innerHTML = '🔗 USB Disconnect';
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
      usbConnectBtn.innerHTML = '🔗 USB Connect';
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
  const confirmedFwDownload = window.confirm("Firmware download is quite slow and will take several minutes. " +
    "Firmware download may fail. It may render your RCX (temporarily) unusable." +
    "\n\nI know what I am doing and want to continue.");

  if(confirmedFwDownload) {
    console.log("Firmware download request confirmed.");
    showInfoMsg("Firmware download request confirmed.");

    // TODO: add mechanism to choose between different firmware versions

    let firmwareName = "RCX firmware";
    if(fastDownloadCb.checked && fastDownloadSupported()) {
      // quad-rate download via firmdl3's fast download stub
      success = await downloadFirmwareFast(firmwareName, firm0332Data, firmdl3FastdlStubData);
    } else {
      success = await downloadFirmware(firmwareName, firm0332Data);
    }

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
