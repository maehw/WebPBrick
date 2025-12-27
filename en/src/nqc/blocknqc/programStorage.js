/*
 * WebPBrick / BlockNQC
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

// This JavaScript code is used for saving/loading programs (storage).

// Serve a JSON file for download
function downloadJsonFile(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// Save program upon request (only to the web browser's "local storage").
document.getElementById('saveOnlineBtn').addEventListener('click', () => {
  if(workspace) {
    // Serialize the state.
    const state = Blockly.serialization.workspaces.save(workspace);

    // Save the stringify-ed state to the web browser's local storage.
    localStorage.setItem('workspace-state', JSON.stringify(state));
  }
});

// Load program upon request (only from the web browser's "local storage")
document.getElementById('loadOnlineBtn').addEventListener('click', () => {
  if(workspace) {
    // Load the parsed stringify-ed saved state from the web browser's local storage.
    const state = JSON.parse(localStorage.getItem('workspace-state'));

    // Deserialize the state and load it to the workspace.
    Blockly.serialization.workspaces.load(state, workspace);
  }
});

// Save program upon request (as a file to be downloaded).
document.getElementById('saveOfflineBtn').addEventListener('click', () => {
  if(workspace) {
    // Serialize the state.
    const state = Blockly.serialization.workspaces.save(workspace);

    // Save the stringify-ed state as downloadable JSON file.
    downloadJsonFile("BlockNQC.json", JSON.stringify(state));
  }
});

// Load program upon request (a file to be "uploaded")
document.getElementById('loadOfflineBtn').addEventListener('change', function () {
  if(workspace) {
    if (this.files && this.files[0]) {
      var fileName = this.files[0];
      var reader = new FileReader();
      console.log(`Loading external file '${fileName.name}'...`);

      reader.addEventListener('load', function (e) {
        console.log(`Loaded external file.`);

        // Load the parsed stringify-ed saved state from the file contents.
        const state = JSON.parse(e.target.result);

        // Deserialize the state and load it to the workspace.
        Blockly.serialization.workspaces.load(state, workspace);
      });

      reader.readAsBinaryString(fileName);
    }
  }
});
