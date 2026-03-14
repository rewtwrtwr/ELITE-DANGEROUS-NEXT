; Elite Dangerous NEXT - Layout Manager - Full Installer
; Requires NSIS 3.0+

!include "MUI2.nsh"

; General
Name "Elite Dangerous NEXT - Layout Manager"
OutFile "EliteDangerous-LayoutManager-Full-Setup.exe"
InstallDir "$PROGRAMFILES\ED-LayoutManager"
InstallDirRegKey HKLM "Software\ED-LayoutManager" "InstallDir"
RequestExecutionLevel admin
ShowInstDetails show

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

; Sections
Section "Main Application" SecMain
  SetOutPath "$INSTDIR"
  
  ; Copy files
  File "LICENSE"
  File "README-EXE.md"
  File "DISTRIBUTION.md"
  File "package.json"
  File "tsconfig.json"
  File "launch.bat"
  
  ; Copy source files
  SetOutPath "$INSTDIR\src"
  File /r "src"
  
  ; Copy layout-manager
  SetOutPath "$INSTDIR\layout-manager"
  File /r "layout-manager"
  
  ; Copy public (including index.html)
  SetOutPath "$INSTDIR\public"
  File "public\index.html"
  File /r "public\assets"
  File /r "public\favicon.ico"
  
  ; Copy scripts
  SetOutPath "$INSTDIR\scripts"
  File /r "scripts"
  
  ; Create shortcuts
  CreateDirectory "$SMPROGRAMS\ED Layout Manager"
  CreateShortCut "$SMPROGRAMS\ED Layout Manager\Launch.lnk" "$INSTDIR\launch.bat"
  CreateShortCut "$SMPROGRAMS\ED Layout Manager\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortCut "$DESKTOP\ED Layout Manager.lnk" "$INSTDIR\launch.bat"
  
  ; Write uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Write registry
  WriteRegStr HKLM "Software\ED-LayoutManager" "InstallDir" "$INSTDIR"
  
  ; Install npm dependencies
  DetailPrint "Installing npm dependencies (this may take a few minutes)..."
  nsExec::ExecToLog 'cmd /c "cd /d $INSTDIR && npm install"'
  
  ; Build project
  DetailPrint "Building project..."
  nsExec::ExecToLog 'cmd /c "cd /d $INSTDIR && npm run build"'
  
SectionEnd

Section "Auto-Start" SecAutoStart
  ; Add to Windows startup
  CreateShortCut "$APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ED Layout Manager.lnk" "$INSTDIR\launch.bat"
SectionEnd

; Uninstaller
Section "Uninstall"
  ; Remove shortcuts
  Delete "$SMPROGRAMS\ED Layout Manager\Launch.lnk"
  Delete "$SMPROGRAMS\ED Layout Manager\Uninstall.lnk"
  RMDir "$SMPROGRAMS\ED Layout Manager"
  Delete "$DESKTOP\ED Layout Manager.lnk"
  Delete "$APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ED Layout Manager.lnk"
  
  ; Remove files
  RMDir /r "$INSTDIR\src"
  RMDir /r "$INSTDIR\layout-manager"
  RMDir /r "$INSTDIR\public"
  RMDir /r "$INSTDIR\node_modules"
  RMDir /r "$INSTDIR\dist"
  Delete "$INSTDIR\launch.bat"
  Delete "$INSTDIR\README-EXE.md"
  Delete "$INSTDIR\DISTRIBUTION.md"
  Delete "$INSTDIR\package.json"
  Delete "$INSTDIR\tsconfig.json"
  Delete "$INSTDIR\LICENSE"
  Delete "$INSTDIR\Uninstall.exe"
  
  ; Remove registry
  DeleteRegKey HKLM "Software\ED-LayoutManager"
  
  ; Remove directory
  RMDir "$INSTDIR"
SectionEnd

; Descriptions
LangString DESC_SecMain ${LANG_ENGLISH} "Main application files with automatic npm install"
LangString DESC_SecAutoStart ${LANG_ENGLISH} "Add to Windows startup"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecMain} $(DESC_SecMain)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecAutoStart} $(DESC_SecAutoStart)
!insertmacro MUI_FUNCTION_DESCRIPTION_END
