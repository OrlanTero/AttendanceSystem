Imports System.Threading
Imports DPUruNet
Imports Fid = DPUruNet.Fid
Public Class Biometric

    Public _reader As Reader

    Public status As String

    Public Result As Fid

    Private callback As Action(Of String)

    Private statusCallback As Action(Of String)

    Private mythread As Thread

    Public Sub SetStatus(stat As String)
        Me.status = stat

        If statusCallback IsNot Nothing Then
            Try
                statusCallback.Invoke(stat)
            Catch ex As Exception

            End Try
        End If
    End Sub
    Public Sub Initialize(task As Task)
        Try
            Dim readers As List(Of Reader) = ReaderCollection.GetReaders().ToList()

            If readers Is Nothing OrElse readers.Count = 0 Then
                SetStatus("No fingerprint readers found.")
                Return
            End If

            ' Use the first available reader
            _reader = readers(0)

            SetStatus("Biometric Ready")

            If task IsNot Nothing Then
                task.RunSynchronously()
                Return
            End If

        Catch ex As Exception
            SetStatus("Error initializing reader: " & ex.Message)
        End Try

    End Sub

    Public Sub Start()
        mythread = New Thread(AddressOf ReadBiometric)
        mythread.IsBackground = True
        mythread.Start()
    End Sub

    Public Sub ReadBiometric()
        Try
            If _reader Is Nothing Then
                SetStatus("Please initialize a reader first.")
                Return
            End If

            ' Open the reader
            Dim result = _reader.Open(Constants.CapturePriority.DP_PRIORITY_COOPERATIVE)
            If result <> Constants.ResultCode.DP_SUCCESS Then
                SetStatus("Failed to open reader: " & result.ToString())
                Return
            End If

            ' Set status to prompt user
            SetStatus("Please place your finger on the scanner...")
            
            ' Add a small delay to ensure the status message is displayed
            Thread.Sleep(500)

            ' Capture the fingerprint
            Console.WriteLine("Starting fingerprint capture...")
            
            ' Perform the capture with explicit parameters
            Dim captureResult = _reader.Capture(
                Constants.Formats.Fid.ANSI,
                Constants.CaptureProcessing.DP_IMG_PROC_DEFAULT,
                30000, ' 30 seconds timeout
                _reader.Capabilities.Resolutions(0)
            )

            ' Handle capture result
            If captureResult.ResultCode = Constants.ResultCode.DP_SUCCESS Then
                Console.WriteLine("Fingerprint captured successfully!")
                
                ' Store the result and trigger callback
                DisplayFingerprint(captureResult.Data)
                SetStatus("Fingerprint captured successfully.")
            Else
                Console.WriteLine("Failed to capture fingerprint: " + captureResult.ResultCode.ToString())
                SetStatus("Failed to capture fingerprint: " + captureResult.ResultCode.ToString())
            End If

            ' Close the reader to release resources
            _reader.Dispose()

        Catch ex As Exception
            Console.WriteLine("Error capturing fingerprint: " & ex.Message)
            SetStatus("Error capturing fingerprint: " & ex.Message)
        End Try
    End Sub

    Public Sub Close()
        If _reader IsNot Nothing Then
            _reader.Dispose()
        End If
    End Sub

    Public Sub OnFingerPrint(callback As Action(Of String))
        Console.WriteLine("Registering fingerprint callback")
        Me.callback = callback
    End Sub

    Public Sub OnStatusChange(callback As Action(Of String))
        Console.WriteLine("Registering status callback")
        Me.statusCallback = callback
    End Sub

    Private Sub DisplayFingerprint(result As Fid)
        Try
            Console.WriteLine("Processing captured fingerprint...")
            
            ' Serialize the fingerprint data to XML
            Dim fingerprintData As String = Fid.SerializeXml(result)
            
            ' Store the result for later use
            Result = result
            
            ' Invoke the callback with the serialized data if it exists
            If callback IsNot Nothing Then
                Console.WriteLine("Invoking fingerprint callback...")
                callback.Invoke(fingerprintData)
            Else
                Console.WriteLine("Warning: No callback registered for fingerprint capture")
            End If
            
        Catch ex As Exception
            Console.WriteLine("Error processing fingerprint: " & ex.Message)
            SetStatus("Error processing fingerprint: " & ex.Message)
        End Try
    End Sub

    Public Function CompareFingerPrint(fingerPrintData As String, fingerPrint As Fid)
        Dim fff As Fid = Fid.DeserializeXml(fingerPrintData)
        Dim result As CompareResult = Nothing

        Try
            Dim resultConversion = FeatureExtraction.CreateFmdFromFid(fingerPrint, Constants.Formats.Fmd.ANSI)
            result = Comparison.Compare(FeatureExtraction.CreateFmdFromFid(fff, Constants.Formats.Fmd.ANSI).Data, 0, resultConversion.Data, 0)

            Return result.Score
        Catch ex As Exception
            SetStatus("Error comparing fingerprints: " & ex.Message)
            MsgBox("Error comparing fingerprints: " & ex.Message)
        End Try

        Return -1
    End Function


End Class
