Module Program
    Sub Main()
        Dim thread As New Threading.Thread(Sub()
                                               SocketFingerprintServer.Start()
                                           End Sub)


        thread.IsBackground = True
        thread.Start()

        Console.ReadKey()

    End Sub
End Module
