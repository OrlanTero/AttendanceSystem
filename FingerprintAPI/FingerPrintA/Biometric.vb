Imports System.Threading
Imports DPUruNet
Imports Fid = DPUruNet.Fid
Public Class Biometric

    Public _reader As Reader

    Public status As String

    Public Result As Fid

    Public callback As Action(Of String)

    Public statusCallback As Action(Of String)

    Private mythread As Thread

    Public Sub SetStatus(stat As String)
        Me.status = stat
        Console.WriteLine($"[Biometric Device] Status changed: {stat}")

        If statusCallback IsNot Nothing Then
            statusCallback.Invoke(stat)
        End If
    End Sub

    Public Sub Initialize(task As Task)
        Try
            Console.WriteLine("[Biometric Device] Initializing fingerprint reader...")
            Dim readers As List(Of Reader) = ReaderCollection.GetReaders().ToList()

            If readers Is Nothing OrElse readers.Count = 0 Then
                Console.WriteLine("[Biometric Device] ERROR: No fingerprint readers found")
                SetStatus("No fingerprint readers found.")
                Return
            End If

            Console.WriteLine($"[Biometric Device] Found {readers.Count} reader(s)")
            ' Use the first available reader
            _reader = readers(0)
            Console.WriteLine($"[Biometric Device] Using reader: {_reader.Description.SerialNumber}")

            SetStatus("Biometric Ready")

            If task IsNot Nothing Then
                Console.WriteLine("[Biometric Device] Running initialization task")
                task.RunSynchronously()
                Return
            End If

        Catch ex As Exception
            Console.WriteLine($"[Biometric Device] ERROR during initialization: {ex.Message}")
            SetStatus("Error initializing reader: " & ex.Message)
        End Try

    End Sub

    Public Sub Start()
        Console.WriteLine("[Biometric Device] Starting biometric capture thread")
        mythread = New Thread(AddressOf ReadBiometric)
        mythread.IsBackground = False
        mythread.Start()
    End Sub

    Public Sub ReadBiometric()
        Try
            If _reader Is Nothing Then
                Console.WriteLine("[Biometric Device] ERROR: Reader not initialized")
                SetStatus("Please initialize a reader first.")
                Return
            End If

            Console.WriteLine("[Biometric Device] Opening reader for capture...")
            ' Open the reader
            Dim result = _reader.Open(Constants.CapturePriority.DP_PRIORITY_EXCLUSIVE)
            If result <> Constants.ResultCode.DP_SUCCESS Then
                Console.WriteLine("[Biometric Device] ERROR: Failed to open reader")
                SetStatus("Failed to open reader.")
                Return
            End If

            Console.WriteLine("[Biometric Device] Reader opened successfully, starting capture...")
            Task.Run(Sub()
                         ' Capture the fingerprint
                         Console.WriteLine("[Biometric Device] Attempting to capture fingerprint...")
                         Dim captureResult = _reader.Capture(Constants.Formats.Fid.ANSI, Constants.CaptureProcessing.DP_IMG_PROC_DEFAULT, 100000000, _reader.Capabilities.Resolutions(0))

                         Try
                             ' Handle capture result
                             If captureResult.ResultCode = Constants.ResultCode.DP_SUCCESS Then
                                 Console.WriteLine("[Biometric Device] Fingerprint captured successfully")
                                 DisplayFingerprint(captureResult.Data)
                                 SetStatus("Fingerprint captured successfully.")
                             Else
                                 Console.WriteLine($"[Biometric Device] ERROR: Capture failed with code {captureResult.ResultCode}")
                                 SetStatus("Failed to capture fingerprint.")
                             End If
                         Catch ex As Exception
                             Console.WriteLine($"[Biometric Device] ERROR during capture: {ex.Message}")
                         End Try
                     End Sub)

        Catch ex As Exception
            Console.WriteLine($"[Biometric Device] ERROR in ReadBiometric: {ex.Message}")
            SetStatus("Error capturing fingerprint: " & ex.Message)
        End Try
    End Sub

    Public Sub Close()
        Console.WriteLine("[Biometric Device] Closing reader...")

        If _reader IsNot Nothing Then
            _reader.Dispose()
        End If
        Console.WriteLine("[Biometric Device] Reader closed")
    End Sub

    Public Sub OnFingerPrint(task As Action(Of String))
        Console.WriteLine("[Biometric Device] Setting up fingerprint callback")
        Me.callback = task
    End Sub

    Public Sub OnStatusChange(task As Action(Of String))
        Console.WriteLine("[Biometric Device] Setting up status change callback")
        Me.statusCallback = task
    End Sub

    Public Sub DisplayFingerprint(result As Fid)
        Console.WriteLine("[Biometric Device] Processing captured fingerprint")
        Me.Result = result
        callback.Invoke(Fid.SerializeXml(result))
        Console.WriteLine("[Biometric Device] Fingerprint processed and sent to callback")
    End Sub

    Public Function CompareFingerPrint(fingerPrintData As String, fingerPrint As Fid)
        Console.WriteLine("[Biometric Device] Starting fingerprint comparison")
        Dim fff As Fid = Fid.DeserializeXml(fingerPrintData)
        Dim result As CompareResult = Nothing

        Try
            Dim resultConversion = FeatureExtraction.CreateFmdFromFid(fingerPrint, Constants.Formats.Fmd.ANSI)
            result = Comparison.Compare(FeatureExtraction.CreateFmdFromFid(fff, Constants.Formats.Fmd.ANSI).Data, 0, resultConversion.Data, 0)
            Console.WriteLine($"[Biometric Device] Comparison completed. Score: {result.Score}")
            Return result.Score
        Catch ex As Exception
            Console.WriteLine($"[Biometric Device] ERROR during comparison: {ex.Message}")
            SetStatus("Error comparing fingerprints: " & ex.Message)
            MsgBox("Error comparing fingerprints: " & ex.Message)
        End Try

        Return -1
    End Function

    Public Function CompareFingerPrint(fingerPrintData As String, fingerPrintData2 As String)
        Try
            Console.WriteLine("[Biometric Device] Starting fingerprint comparison")
            Dim fff As Fid
            Dim fff2 As Fid
            Try
                fff = Fid.DeserializeXml(fingerPrintData)

                'Console.WriteLine("Serialize 1 Complete!")
            Catch ex As Exception
                'Console.WriteLine("Serialize 1 Failed!")

            End Try

            Try
                fff2 = Fid.DeserializeXml(fingerPrintData2)

                'Console.WriteLine("Serialize 2 Complete!")

            Catch ex As Exception
                'Console.WriteLine("Serialize 2 Failed!")

            End Try
            Dim result As CompareResult = Nothing

            Try
                result = Comparison.Compare(FeatureExtraction.CreateFmdFromFid(fff, Constants.Formats.Fmd.ANSI).Data, 0, FeatureExtraction.CreateFmdFromFid(fff2, Constants.Formats.Fmd.ANSI).Data, 0)
                'Console.WriteLine($"[Biometric Device] Comparison completed. Score: {result.Score}")
                Return result.Score < 21474
            Catch ex As Exception
                'Console.WriteLine($"[Biometric Device] ERROR during comparison: {ex.Message}")
                SetStatus("Error comparing fingerprints: " & ex.Message)
                MsgBox("Error comparing fingerprints: " & ex.Message)
            End Try

            Return False
        Catch ex As Exception
            Console.WriteLine(ex.Message)
            Return False
        End Try
    End Function

End Class
