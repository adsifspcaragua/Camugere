' Inicia o sistema da Biblioteca Camugere SEM janela e abre o navegador.
' Se o sistema ja estiver rodando, apenas abre o navegador. Para desligar: parar-camugere.bat.
' Se algo der errado, o motivo fica em camugere.log, ao lado deste arquivo.
Option Explicit
Dim sh, fso, raiz, url
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
raiz = fso.GetParentFolderName(WScript.ScriptFullName)
url = "http://localhost:3000"

Function NoAr()
  On Error Resume Next
  Dim http
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.setTimeouts 1000, 1000, 1000, 1000
  http.open "GET", url & "/status", False
  http.send
  NoAr = (Err.Number = 0 And http.Status = 200)
  On Error GoTo 0
End Function

If Not NoAr() Then
  sh.CurrentDirectory = raiz & "\api"
  sh.Run "cmd /c node src\server.js >> """ & raiz & "\camugere.log"" 2>&1", 0, False
  Dim i
  For i = 1 To 30
    WScript.Sleep 500
    If NoAr() Then Exit For
  Next
  If Not NoAr() Then
    MsgBox "O sistema nao iniciou. Veja o arquivo camugere.log na pasta do sistema.", 48, "Biblioteca Camugere"
    WScript.Quit 1
  End If
End If
sh.Run url
