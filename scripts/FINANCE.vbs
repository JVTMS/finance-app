' FINANCE — launcher silencioso: executa o FINANCE.bat sem mostrar janela de console.
' O bat sobe o PostgreSQL embutido, abre a janela do aplicativo e, ao fechá-la,
' encerra o banco. Este .vbs apenas esconde o console do bat.
Dim shell, fso, folder
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = folder
shell.Run """" & folder & "\FINANCE.bat""", 0, False
