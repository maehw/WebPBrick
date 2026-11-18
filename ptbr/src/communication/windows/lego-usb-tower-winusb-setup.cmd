@echo off
rem WebPBrick
rem Copyright (C) 2024-2026 maehw
rem
rem This program is free software: you can redistribute it and/or modify
rem it under the terms of the GNU General Public License as published by
rem the Free Software Foundation, either version 3 of the License, or
rem (at your option) any later version.
rem
rem This program is distributed in the hope that it will be useful,
rem but WITHOUT ANY WARRANTY; without even the implied warranty of
rem MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
rem GNU General Public License for more details.
rem
rem You should have received a copy of the GNU General Public License
rem along with this program.  If not, see http://www.gnu.org/licenses/.
rem
rem Makes the LEGO USB IR Tower usable from the web browser (WebUSB) on 64-bit Windows.
rem
rem A browser can only open a USB device which uses the WinUSB driver. Windows ships this
rem driver (winusb.sys with winusb.inf, signed by Microsoft), but only selects it automatically
rem for devices which ask for it - the tower does not. This script does the same as the
rem Device Manager's "Update driver - Let me pick - Universal Serial Bus devices - WinUsb Device":
rem it selects the driver which is already part of Windows for the tower. Nothing is downloaded
rem and no certificate is installed. It needs administrator rights (one Windows prompt).
rem
rem Usage: plug in the tower and double-click this file.
rem        "lego-usb-tower-winusb-setup.cmd check" only reports the current state and changes nothing.
rem
rem The rest of this file (below the marker line) is a PowerShell script which is started from here.
setlocal
set "TOWER_SETUP_SELF=%~f0"
set "TOWER_SETUP_ARG=%~1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$s = [IO.File]::ReadAllText($env:TOWER_SETUP_SELF); $s = $s.Substring($s.IndexOf('#PS' + 'START')); & ([ScriptBlock]::Create($s))"
exit /b %ERRORLEVEL%

#PSSTART
$ErrorActionPreference = 'Stop'
$self = $env:TOWER_SETUP_SELF
$mode = $env:TOWER_SETUP_ARG

function Finish($code) {
    if ($mode -ne 'check') {
        Write-Host ''
        Read-Host 'Press Enter to close this window' | Out-Null
    }
    exit $code
}

Write-Host 'LEGO USB IR Tower: WinUSB driver setup'
Write-Host '--------------------------------------'

if (-not [Environment]::Is64BitProcess) {
    Write-Host 'This script is for 64-bit Windows only.'
    Finish 1
}

$source = @'
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;

public static class TowerDriver
{
    const string HardwareId = "VID_0694&PID_0001";
    // WinUSB needs a "device interface GUID" so that programs can find the device. The generic entry
    // of winusb.inf does not set one. This is the GUID which the RCX Tower program uses, too.
    const string InterfaceGuid = "{6C1E5B0A-3F2D-4E7B-9A51-52435854574F}";
    const string UsbDeviceClass = "{88BAE032-5A81-49F0-BC3D-A4FF138216D6}";

    const uint DIGCF_PRESENT = 0x2, DIGCF_ALLCLASSES = 0x4;
    const uint SPDIT_CLASSDRIVER = 1;
    const uint DI_ENUMSINGLEINF = 0x00010000;
    const uint DI_FLAGSEX_ALLOWEXCLUDEDDRVS = 0x00000800;
    const uint SPDRP_SERVICE = 0x04, SPDRP_CLASSGUID = 0x08;
    const uint DICS_FLAG_GLOBAL = 1, DIREG_DEV = 1;
    const uint REG_MULTI_SZ = 7;
    static readonly IntPtr Invalid = new IntPtr(-1);

    [StructLayout(LayoutKind.Sequential)]
    struct SP_DEVINFO_DATA
    {
        public uint cbSize;
        public Guid ClassGuid;
        public uint DevInst;
        public IntPtr Reserved;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct SP_DEVINSTALL_PARAMS
    {
        public uint cbSize;
        public uint Flags;
        public uint FlagsEx;
        public IntPtr hwndParent;
        public IntPtr InstallMsgHandler;
        public IntPtr InstallMsgHandlerContext;
        public IntPtr FileQueue;
        public IntPtr ClassInstallReserved;
        public uint Reserved;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)] public string DriverPath;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct SP_DRVINFO_DATA
    {
        public uint cbSize;
        public uint DriverType;
        public IntPtr Reserved;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string Description;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string MfgName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)] public string ProviderName;
        public System.Runtime.InteropServices.ComTypes.FILETIME DriverDate;
        public ulong DriverVersion;
    }

    [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern IntPtr SetupDiGetClassDevsW(IntPtr classGuid, string enumerator, IntPtr hwnd, uint flags);
    [DllImport("setupapi.dll", SetLastError = true)]
    static extern bool SetupDiEnumDeviceInfo(IntPtr devs, uint index, ref SP_DEVINFO_DATA dev);
    [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetupDiGetDeviceInstanceIdW(IntPtr devs, ref SP_DEVINFO_DATA dev, StringBuilder id, uint size, IntPtr required);
    [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetupDiGetDeviceRegistryPropertyW(IntPtr devs, ref SP_DEVINFO_DATA dev, uint property, IntPtr type, byte[] buffer, uint size, IntPtr required);
    [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetupDiSetDeviceRegistryPropertyW(IntPtr devs, ref SP_DEVINFO_DATA dev, uint property, byte[] buffer, uint size);
    [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetupDiGetDeviceInstallParamsW(IntPtr devs, ref SP_DEVINFO_DATA dev, ref SP_DEVINSTALL_PARAMS p);
    [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetupDiSetDeviceInstallParamsW(IntPtr devs, ref SP_DEVINFO_DATA dev, ref SP_DEVINSTALL_PARAMS p);
    [DllImport("setupapi.dll", SetLastError = true)]
    static extern bool SetupDiBuildDriverInfoList(IntPtr devs, ref SP_DEVINFO_DATA dev, uint type);
    [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetupDiEnumDriverInfoW(IntPtr devs, ref SP_DEVINFO_DATA dev, uint type, uint index, ref SP_DRVINFO_DATA drv);
    [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool SetupDiSetSelectedDriverW(IntPtr devs, ref SP_DEVINFO_DATA dev, ref SP_DRVINFO_DATA drv);
    [DllImport("setupapi.dll", SetLastError = true)]
    static extern bool SetupDiDestroyDriverInfoList(IntPtr devs, ref SP_DEVINFO_DATA dev, uint type);
    [DllImport("setupapi.dll", SetLastError = true)]
    static extern bool SetupDiDestroyDeviceInfoList(IntPtr devs);
    [DllImport("setupapi.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern IntPtr SetupDiCreateDevRegKeyW(IntPtr devs, ref SP_DEVINFO_DATA dev, uint scope, uint hwProfile, uint keyType, IntPtr infHandle, string infSection);
    [DllImport("advapi32.dll", CharSet = CharSet.Unicode)]
    static extern int RegSetValueExW(IntPtr key, string name, uint reserved, uint type, byte[] data, uint size);
    [DllImport("advapi32.dll")]
    static extern int RegCloseKey(IntPtr key);
    [DllImport("newdev.dll", SetLastError = true)]
    static extern bool DiInstallDevice(IntPtr hwnd, IntPtr devs, ref SP_DEVINFO_DATA dev, ref SP_DRVINFO_DATA drv, uint flags, out bool needReboot);

    static Exception Error(string what)
    {
        return new Exception(what + ": " + new Win32Exception(Marshal.GetLastWin32Error()).Message);
    }

    static IntPtr AllDevices()
    {
        IntPtr devs = SetupDiGetClassDevsW(IntPtr.Zero, null, IntPtr.Zero, DIGCF_PRESENT | DIGCF_ALLCLASSES);
        if (devs == IntPtr.Zero || devs == Invalid) throw Error("listing devices");
        return devs;
    }

    // Finds the plugged-in tower; returns its device instance ID or null.
    static string FindTower(IntPtr devs, out SP_DEVINFO_DATA dev)
    {
        for (uint i = 0; ; i++)
        {
            dev = new SP_DEVINFO_DATA();
            dev.cbSize = (uint)Marshal.SizeOf(typeof(SP_DEVINFO_DATA));
            if (!SetupDiEnumDeviceInfo(devs, i, ref dev)) return null;
            StringBuilder id = new StringBuilder(512);
            if (SetupDiGetDeviceInstanceIdW(devs, ref dev, id, 512, IntPtr.Zero)
                && id.ToString().ToUpperInvariant().StartsWith("USB\\" + HardwareId))
                return id.ToString();
        }
    }

    static string Service(IntPtr devs, ref SP_DEVINFO_DATA dev)
    {
        byte[] buffer = new byte[512];
        if (!SetupDiGetDeviceRegistryPropertyW(devs, ref dev, SPDRP_SERVICE, IntPtr.Zero, buffer, 512, IntPtr.Zero)) return "";
        return Encoding.Unicode.GetString(buffer).Split('\0')[0];
    }

    // Points the device at winusb.inf and looks for the generic "WinUsb Device" driver entry.
    static bool WinUsbDriver(IntPtr devs, ref SP_DEVINFO_DATA dev, out SP_DRVINFO_DATA found, List<string> names)
    {
        found = new SP_DRVINFO_DATA();
        SP_DEVINSTALL_PARAMS p = new SP_DEVINSTALL_PARAMS();
        p.cbSize = (uint)Marshal.SizeOf(typeof(SP_DEVINSTALL_PARAMS));
        if (!SetupDiGetDeviceInstallParamsW(devs, ref dev, ref p)) throw Error("reading the device's install settings");
        p.Flags |= DI_ENUMSINGLEINF;
        p.FlagsEx |= DI_FLAGSEX_ALLOWEXCLUDEDDRVS;
        p.DriverPath = System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows), "inf", "winusb.inf");
        if (!System.IO.File.Exists(p.DriverPath)) throw new Exception("this Windows has no " + p.DriverPath);
        if (!SetupDiSetDeviceInstallParamsW(devs, ref dev, ref p)) throw Error("selecting winusb.inf");
        if (!SetupDiBuildDriverInfoList(devs, ref dev, SPDIT_CLASSDRIVER)) throw Error("listing the drivers in winusb.inf");

        bool ok = false;
        for (uint i = 0; ; i++)
        {
            SP_DRVINFO_DATA drv = new SP_DRVINFO_DATA();
            drv.cbSize = (uint)Marshal.SizeOf(typeof(SP_DRVINFO_DATA));
            if (!SetupDiEnumDriverInfoW(devs, ref dev, SPDIT_CLASSDRIVER, i, ref drv)) break;
            names.Add(drv.Description);
            if (!ok && drv.Description.ToLowerInvariant().Contains("winusb"))
            {
                found = drv;
                ok = true;
            }
        }
        return ok;
    }

    // Reports the current state without changing anything; no administrator rights needed.
    // Returns: device instance ID ("" if the tower is not plugged in), current driver service,
    // name of the driver which would be installed ("" if none was found).
    public static string[] Status()
    {
        IntPtr devs = AllDevices();
        try
        {
            SP_DEVINFO_DATA dev;
            string instance = FindTower(devs, out dev);
            if (instance == null) return new string[] { "", "", "" };
            string service = Service(devs, ref dev);
            string wouldInstall = "";
            try
            {
                SP_DRVINFO_DATA drv;
                List<string> names = new List<string>();
                if (WinUsbDriver(devs, ref dev, out drv, names)) wouldInstall = drv.Description + " (" + drv.ProviderName + ")";
            }
            catch (Exception) { }
            return new string[] { instance, service, wouldInstall };
        }
        finally
        {
            SetupDiDestroyDeviceInfoList(devs);
        }
    }

    // Binds WinUSB to the tower. Needs administrator rights.
    public static void Install(Action<string> log)
    {
        IntPtr devs = AllDevices();
        try
        {
            SP_DEVINFO_DATA dev;
            string instance = FindTower(devs, out dev);
            if (instance == null) throw new Exception("the tower is not plugged in");
            log("Tower found: " + instance);

            // the interface GUID has to be in place before WinUSB starts on the device
            IntPtr key = SetupDiCreateDevRegKeyW(devs, ref dev, DICS_FLAG_GLOBAL, 0, DIREG_DEV, IntPtr.Zero, null);
            if (key == IntPtr.Zero || key == Invalid) throw Error("opening the tower's registry key");
            byte[] value = Encoding.Unicode.GetBytes(InterfaceGuid + "\0\0"); // multi-string: one entry, then the end
            int result = RegSetValueExW(key, "DeviceInterfaceGUIDs", 0, REG_MULTI_SZ, value, (uint)value.Length);
            RegCloseKey(key);
            if (result != 0) throw new Exception("could not write the device interface GUID");
            log("Device interface GUID written.");

            SP_DRVINFO_DATA drv = new SP_DRVINFO_DATA();
            List<string> names = new List<string>();
            bool found = false;
            try { found = WinUsbDriver(devs, ref dev, out drv, names); } catch (Exception) { }
            if (!found)
            {
                // a device nobody has claimed has no class yet; give it WinUSB's class and look again
                SetupDiDestroyDriverInfoList(devs, ref dev, SPDIT_CLASSDRIVER);
                byte[] cls = Encoding.Unicode.GetBytes(UsbDeviceClass + "\0");
                if (!SetupDiSetDeviceRegistryPropertyW(devs, ref dev, SPDRP_CLASSGUID, cls, (uint)cls.Length))
                    throw Error("setting the tower's device class");
                dev.ClassGuid = new Guid(UsbDeviceClass);
                names.Clear();
                found = WinUsbDriver(devs, ref dev, out drv, names);
            }
            if (!found)
                throw new Exception("winusb.inf has no generic WinUSB driver (it lists: " + (names.Count > 0 ? String.Join(", ", names.ToArray()) : "nothing") + ")");
            log("Selected driver: " + drv.Description + " (" + drv.ProviderName + ")");
            if (!SetupDiSetSelectedDriverW(devs, ref dev, ref drv)) throw Error("selecting the WinUSB driver");

            bool reboot;
            if (!DiInstallDevice(IntPtr.Zero, devs, ref dev, ref drv, 0, out reboot)) throw Error("installing the driver");
            log("Driver installed." + (reboot ? " Windows wants a restart." : ""));
        }
        finally
        {
            SetupDiDestroyDeviceInfoList(devs);
        }
    }
}
'@

try {
    Add-Type -TypeDefinition $source
    $status = [TowerDriver]::Status()
}
catch {
    Write-Host ('Something went wrong: ' + $_.Exception.Message)
    Finish 1
}

$instance = $status[0]
$service = $status[1]
$wouldInstall = $status[2]

if ($instance -eq '') {
    Write-Host 'No LEGO USB Tower found. Plug the tower in and start this file again.'
    Finish 1
}
Write-Host ('Tower found: ' + $instance)

$interfaceGuids = $null
try {
    $key = 'HKLM:\SYSTEM\CurrentControlSet\Enum\' + $instance + '\Device Parameters'
    $interfaceGuids = (Get-ItemProperty -LiteralPath $key -ErrorAction Stop).DeviceInterfaceGUIDs
}
catch { }

if ($service -eq '') {
    Write-Host 'Current driver: none'
}
else {
    Write-Host ('Current driver: ' + $service)
}

if (($service -ieq 'WinUSB') -and $interfaceGuids) {
    Write-Host ''
    Write-Host 'The tower already uses the WinUSB driver. Nothing to do.'
    Write-Host 'If the browser still cannot open the tower, close other programs which use it.'
    Finish 0
}

if ($wouldInstall -eq '') {
    Write-Host 'Could not find the WinUSB driver of Windows for the tower (yet).'
}
else {
    Write-Host ('Driver to install: ' + $wouldInstall)
}

if ($mode -eq 'check') {
    Write-Host 'Check only: nothing has been changed.'
    Finish 0
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$isAdmin = (New-Object Security.Principal.WindowsPrincipal($identity)).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host ''
    Write-Host 'Installing the driver needs administrator rights. Please confirm the Windows prompt.'
    try {
        Start-Process -FilePath $env:ComSpec -ArgumentList ('/c ""' + $self + '" elevated"') -Verb RunAs
    }
    catch {
        Write-Host 'The prompt was declined, nothing has been changed.'
        Finish 1
    }
    exit 0
}

try {
    [TowerDriver]::Install([Action[string]] { param($line) Write-Host $line })
    $status = [TowerDriver]::Status()
}
catch {
    Write-Host ''
    Write-Host ('Failed: ' + $_.Exception.Message)
    Finish 1
}

Write-Host ''
if ($status[1] -ieq 'WinUSB') {
    Write-Host 'Done. Go back to the browser and connect to the USB tower again.'
    Finish 0
}
Write-Host ('The driver was installed, but the tower reports the driver "' + $status[1] + '". Unplug the tower, plug it in again and retry.')
Finish 1
