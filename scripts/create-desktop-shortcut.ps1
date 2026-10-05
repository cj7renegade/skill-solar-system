# Creates (or refreshes) a "Skill Solar System" shortcut on the desktop with the app's icon.
# It starts the app the same way Launch-Windows.cmd does (this project's Electron, this folder).
# The shortcut carries the app's id (local.skillsolarsystem.atlas, set in desktop\main.cjs), so after
# you pin it, the pinned icon and the running window share one taskbar button.
# Windows does not let a program pin itself: right-click the shortcut and choose Pin to taskbar.
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$electron = Join-Path $project 'node_modules\electron\dist\electron.exe'
$icon = Join-Path $project 'desktop\icon.ico'
if (-not (Test-Path $electron)) { Write-Host 'Electron was not found. Run Setup-Windows.cmd first.' -ForegroundColor Red; exit 1 }
if (-not (Test-Path (Join-Path $project 'dist\app.js'))) { Write-Host 'The app is not built yet. Run Setup-Windows.cmd first.' -ForegroundColor Red; exit 1 }
if (-not (Test-Path $icon)) { Write-Host "The icon is missing: $icon" -ForegroundColor Red; exit 1 }

$desktop = [Environment]::GetFolderPath('Desktop')
$link = Join-Path $desktop 'Skill Solar System.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($link)
$shortcut.TargetPath = $electron
$shortcut.Arguments = "`"$project`""
$shortcut.WorkingDirectory = $project
$shortcut.IconLocation = "$icon,0"
$shortcut.Description = 'Skill Solar System: offline 3D skill atlas'
$shortcut.Save()

# Stamp the shortcut with the app's id (System.AppUserModel.ID).
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPropertyStore { void GetCount(out uint count); void GetAt(uint index, out PropertyKey key); void GetValue(ref PropertyKey key, out PropVariant value); void SetValue(ref PropertyKey key, ref PropVariant value); void Commit(); }
[StructLayout(LayoutKind.Sequential, Pack = 4)] struct PropertyKey { public Guid FormatId; public uint PropertyId; }
[StructLayout(LayoutKind.Explicit)] struct PropVariant { [FieldOffset(0)] public ushort Type; [FieldOffset(8)] public IntPtr Pointer; }
[ComImport, Guid("0000010b-0000-0000-C000-000000000046"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPersistFile { void GetClassID(out Guid id); [PreserveSig] int IsDirty(); void Load([MarshalAs(UnmanagedType.LPWStr)] string file, uint mode); void Save([MarshalAs(UnmanagedType.LPWStr)] string file, bool remember); void SaveCompleted([MarshalAs(UnmanagedType.LPWStr)] string file); void GetCurFile([MarshalAs(UnmanagedType.LPWStr)] out string file); }
[ComImport, Guid("00021401-0000-0000-C000-000000000046")] class ShellLink { }
public static class ShortcutAppId {
  public static void Set(string link, string id) {
    var shortcut = new ShellLink(); var file = (IPersistFile)shortcut; file.Load(link, 2);
    var store = (IPropertyStore)shortcut;
    var key = new PropertyKey { FormatId = new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), PropertyId = 5 };
    var value = new PropVariant { Type = 31, Pointer = Marshal.StringToCoTaskMemUni(id) };
    try { store.SetValue(ref key, ref value); store.Commit(); file.Save(link, true); }
    finally { Marshal.FreeCoTaskMem(value.Pointer); }
  }
}
'@
[ShortcutAppId]::Set($link, 'local.skillsolarsystem.atlas')

$item = (New-Object -ComObject Shell.Application).NameSpace($desktop).ParseName('Skill Solar System.lnk')
$id = $item.ExtendedProperty('System.AppUserModel.ID')
Write-Host "Shortcut ready: $link"
Write-Host "App id on shortcut: $id"
Write-Host 'To pin it: right-click the desktop shortcut, choose Show more options if needed, then Pin to taskbar.'
