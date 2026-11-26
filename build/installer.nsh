!include "nsDialogs.nsh"

!macro customHeader
  Var KxDesktop
  Var KxStartMenu
  Var KxDesktopChoice
  Var KxStartMenuChoice
  Var KxAskedShortcuts

  !ifndef BUILD_UNINSTALLER
  Function KxShortcutOptions
    !insertmacro MUI_HEADER_TEXT "选择快捷方式" "分别选择桌面和开始菜单快捷方式。"
    nsDialogs::Create 1018
    Pop $0
    ${If} $0 == error
      Abort
    ${EndIf}

    ${If} $KxAskedShortcuts != 1
      StrCpy $KxDesktopChoice ${BST_UNCHECKED}
      StrCpy $KxStartMenuChoice ${BST_CHECKED}
      ${If} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
        ${IfNot} ${FileExists} "$SMPROGRAMS\${PRODUCT_NAME}.lnk"
          StrCpy $KxStartMenuChoice ${BST_UNCHECKED}
        ${EndIf}
      ${EndIf}
      ${If} ${FileExists} "$DESKTOP\${PRODUCT_NAME}.lnk"
        StrCpy $KxDesktopChoice ${BST_CHECKED}
      ${EndIf}
    ${EndIf}
    ${NSD_CreateCheckbox} 0 18u 100% 12u "创建桌面快捷方式"
    Pop $KxDesktop
    ${NSD_SetState} $KxDesktop $KxDesktopChoice
    ${NSD_CreateCheckbox} 0 40u 100% 12u "创建开始菜单快捷方式"
    Pop $KxStartMenu
    ${NSD_SetState} $KxStartMenu $KxStartMenuChoice
    nsDialogs::Show
  FunctionEnd

  Function KxSaveShortcutOptions
    ${NSD_GetState} $KxDesktop $KxDesktopChoice
    ${NSD_GetState} $KxStartMenu $KxStartMenuChoice
    StrCpy $KxAskedShortcuts 1
  FunctionEnd
  !endif
!macroend

!macro customPageAfterChangeDir
  Page custom KxShortcutOptions KxSaveShortcutOptions
!macroend

!macro customInstall
  ${If} $KxAskedShortcuts == 1
    ${If} $KxDesktopChoice == ${BST_CHECKED}
      CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    ${Else}
      Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
    ${EndIf}

    ${If} $KxStartMenuChoice == ${BST_CHECKED}
      CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    ${Else}
      Delete "$SMPROGRAMS\${PRODUCT_NAME}.lnk"
      StrCpy $launchLink "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
    ${EndIf}
  ${EndIf}
!macroend

!macro customUnInstall
  ${IfNot} ${isUpdated}
    Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
    Delete "$SMPROGRAMS\${PRODUCT_NAME}.lnk"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_ID}"
  ${EndIf}
!macroend
