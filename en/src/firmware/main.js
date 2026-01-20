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
      await checkFirmwareAndBattery();

      enableDownloadFirmwareBtn();
      serialConnectBtn.innerHTML = '🔗 Serial Disconnect';
      serialConnected = true;
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

        let stubName = "fastdl stub";
        let success = await downloadFirmware(stubName, firmdl3FastdlStubData);

        if(success) {
          // TODO: change baud rate
          showInfoMsg("Changing baud rate...");
          await serialSetSpeed();

          //let firmwareName = "LEGO RCX firmware";
          //success = await downloadFirmware(firmwareName, firm0332Data);

          success = await downloadFirmware(stubName, firmdl3FastdlStubData);

          if(success) {
              showInfoMsg("✅ " + capitalize(stubName) + " download complete. 🎉");
          }
        }

        if(!success) {
            showErrorMsg("Failed to download firmware. Make sure the RCX is switched on " +
                "and in line of sight of the IR tower. Please retry!");
        }
        showInfoMsg("Please disconnect and re-connect!");
    }
    else {
        console.log("Firmware download request aborted.");
        showInfoMsg("Firmware download request aborted.");
    }
}
