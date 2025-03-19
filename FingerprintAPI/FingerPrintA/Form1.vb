Public Class Form1
    Private Sub Form1_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        Dim thread As New Threading.Thread(Sub()
                                               SocketFingerprintServer.Start()
                                           End Sub)


        thread.IsBackground = True
        thread.Start()

    End Sub
End Class
