Imports System.Net.Sockets
Imports SocketIOClient
Imports Newtonsoft.Json
Imports Newtonsoft.Json.Linq
Imports System.Text.Json.Nodes
Module SocketFingerprintServer
    Public SOCKET As SocketIOClient.SocketIO
    Public PORT As Integer = 3005
    Public BIOMETRIC As Biometric

    Public Sub Start()
        Console.WriteLine($"[Socket Server] Starting server on port {PORT}")
        SOCKET = New SocketIOClient.SocketIO("http://192.168.1.19:3005/")

        AddHandler SOCKET.OnConnected, Sub()
                                           Console.WriteLine("[Socket Server] Connected to Socket Server!")

                                           OnConnected()
                                       End Sub

        AddHandler SOCKET.OnDisconnected, Sub()
                                              Console.WriteLine("[Socket Server] Disconnected from Socket Server!")

                                              OnDisconnected()
                                          End Sub

        StartBiometricService()

        SOCKET.ConnectAsync()
        Console.WriteLine("[Socket Server] Connection attempt initiated...")
    End Sub

    Public Sub OnConnected()
        SOCKET.EmitAsync("BIOMETRIC_CONNECTED", "")
    End Sub

    Public Sub OnDisconnected()
        SOCKET.EmitAsync("BIOMETRIC_DISCONNECTED", "")
    End Sub

    Public Sub StartBiometricService()
        Console.WriteLine("[Socket Server] Setting up biometric service event handlers")
        SOCKET.On("START", AddressOf ResetBio)
        SOCKET.On("STOP", AddressOf StopBio)
        SOCKET.On("VERIFY_TEMPLATE", AddressOf VerifyBio)
    End Sub

    Public Sub VerifyBio(data As SocketIOResponse)
        Try

            Console.WriteLine("________________________________\n\n")

            Dim jsonString As String = data.ToString()

            ' Parse JSON using Newtonsoft.Json
            Dim jsonArray As JArray = JArray.Parse(jsonString)

            ' Extract first object in the array
            Dim jsonData As JObject = jsonArray(0)

            ' Extract templates and fingerprint
            Dim templates = jsonData("templates")("data")
            Dim fingerprint = jsonData("fingerprint")("message")

            VerifyByTemplates(fingerprint, templates)

        Catch ex As Exception
            Console.WriteLine($"Error: {ex.Message}")
        End Try
    End Sub

    Public Sub VerifyByTemplates(fingerprint As String, templates As JArray)

        Console.WriteLine("_________________RESULT__________________")

        For Each template In templates
            Dim employeeId = template("employee_id").ToString()
            Dim biometricData = template("biometric_data").ToString()

            'Console.WriteLine("Comparing: " & biometricData)

            Dim result = BIOMETRIC.CompareFingerPrint(fingerprint, biometricData)

            If result Then
                Dim resss As JObject = New JObject From {
                    {"employee_id", employeeId},
                    {"employee", template},
                    {"result", "success"}
                }

                SOCKET.EmitAsync("VERIFY_RESULT", resss.ToString)

                ResetBio()
                Return
            End If
        Next

        Dim jsonData As JObject = New JObject From {
                  {"employee_id", Nothing},
                  {"result", "failed"}
              }

        SOCKET.EmitAsync("VERIFY_RESULT", jsonData.ToString)

        ResetBio()

    End Sub

    Public Sub StopBio()
        Console.WriteLine("[Socket Server] Received STOP command")
        BIOMETRIC.Close()
        BIOMETRIC = Nothing
        Console.WriteLine("[Socket Server] Biometric service stopped")
    End Sub

    Public Sub ResetBio()
        Console.WriteLine("[Socket Server] Received START command")
        If BIOMETRIC IsNot Nothing Then
            Console.WriteLine("[Socket Server] Closing existing biometric service")
            BIOMETRIC.Close()
        End If

        BIOMETRIC = New Biometric()

        Dim task As New Action(Of String)(AddressOf OnBio)
        Dim inializeTask As New Task(AddressOf AfterInitialize)
        Dim statusChangeTask As New Action(Of String)(AddressOf StatusChanged)

        BIOMETRIC.OnFingerPrint(task)
        BIOMETRIC.OnStatusChange(statusChangeTask)
        BIOMETRIC.Initialize(inializeTask)
        BIOMETRIC.Start()

        Console.WriteLine("[Socket Server] Biometric service started and listening...")
    End Sub

    Public Sub StatusChanged(status)
        Console.WriteLine($"[Biometric Status] {status}")
        SOCKET.EmitAsync("STATUS", status)
    End Sub

    Public Sub AfterInitialize()
        Console.WriteLine("[Socket Server] Biometric device initialized")
        SOCKET.EmitAsync("FINGERPRINT_INITIALIZED", "")
    End Sub

    Public Sub OnBio(result As String)
        Console.WriteLine("[Socket Server] Fingerprint captured, sending data...")
        SOCKET.EmitAsync("FINGERPRINT_CAPTURE", result)
        Console.WriteLine("[Socket Server] Fingerprint data sent successfully")
    End Sub

End Module
