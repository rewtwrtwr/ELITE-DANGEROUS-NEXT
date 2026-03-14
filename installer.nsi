; Elite Dangerous NEXT - Layout Manager Installer Script
; Install with NSIS (Nullsoft Scriptable Install System)

!include "MUI2.nsh"

; General
Name "Elite Dangerous NEXT - Layout Manager"
OutFile "EliteDangerous-LayoutManager-Setup.exe"
DefaultDir "$PROGRAMFILES\ED-LayoutManager"
DefaultIcon "public\favicon.ico"
InstallDir "$PROGRAMFILES\ED-LayoutManager"
ShowInstDetails show
ShowUnInstDetails show
RequestExecutionLevel admin

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Language
!insertmacro MUI_LANGUAGE "English"

; Installer
Section "Main Application" SecMain
  SetOutPath "$INSTDIR"
  
  ; Copy files
  File "launch.bat"
  File "README-EXE.md"
  File "DISTRIBUTION.md"
  File "package.json"
  
  ; Copy dist folder
  SetOutPath "$INSTDIR\dist"
  File /r "dist\*"
  
  ; Copy layout-manager folder
  SetOutPath "$INSTDIR\layout-manager"
  File /r "layout-manager\*"
  
  ; Copy public folder
  SetOutPath "$INSTDIR\public"
  File /r "public\*"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\ED Layout Manager"
  CreateShortCut "$SMPROGRAMS\ED Layout Manager\Launch.lnk" "$INSTDIR\launch.bat"
  CreateShortCut "$DESKTOP\ED Layout Manager.lnk" "$INSTDIR\launch.bat"
  
  ; Add to PATH (optional)
  ; nsExec::ExecToLog 'setx PATH "%PATH%;$INSTDIR"'
  
  ; Write uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Write registry
  WriteRegStr HKLM "Software\ED-LayoutManager" "InstallDir" "$INSTDIR"
SectionEnd

Section "Auto-Start" SecAutoStart
  ; Add to Windows startup
  CreateShortCut "$APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ED Layout Manager.lnk" "$INSTDIR\launch.bat"
SectionEnd

; Uninstaller
Section "Uninstall"
  ; Remove shortcuts
  Delete "$SMPROGRAMS\ED Layout Manager\Launch.lnk"
  RMDir "$SMPROGRAMS\ED Layout Manager"
  Delete "$DESKTOP\ED Layout Manager.lnk"
  Delete "$APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ED Layout Manager.lnk"
  
  ; Remove files
  RMDir /r "$INSTDIR\dist"
  RMDir /r "$INSTDIR\layout-manager"
  RMDir /r "$INSTDIR\public"
  Delete "$INSTDIR\launch.bat"
  Delete "$INSTDIR\README-EXE.md"
  Delete "$INSTDIR\DISTRIBUTION.md"
  Delete "$INSTDIR\package.json"
  Delete "$INSTDIR\Uninstall.exe"
  
  ; Remove registry
  DeleteRegKey HKLM "Software\ED-LayoutManager"
  
  ; Remove directory
  RMDir "$INSTDIR"
SectionEnd

; Descriptions
LangString DESC_SecMain ${LANG_ENGLISH} "Main application files"
LangString DESC_SecAutoStart ${LANG_ENGLISH} "Add to Windows startup"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} $(DESC_SecMain)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecAutoStart} $(DESC_SecAutoStart)
!insertmacro MUI_FUNCTION_DESCRIPTION_END
