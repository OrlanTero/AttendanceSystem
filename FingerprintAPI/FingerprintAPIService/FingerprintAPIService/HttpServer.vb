Imports System
Imports System.Net
Imports System.Text
Imports System.Threading
Imports System.IO
Imports System.Text.Json
Imports DPUruNet

Public Class HttpServer
    Private listener As HttpListener
    Private _biometric As Biometric
    Private isRunning As Boolean = False

    Public Sub New()
        ' Initialize the HTTP listener
        listener = New HttpListener()
        listener.Prefixes.Add("http://localhost:5000/")
        
        ' Create a new biometric instance
        _biometric = New Biometric()
        
        Console.WriteLine("HTTP Server initialized on http://localhost:5000/")
    End Sub

    Public Sub Start()
        ' Initialize the HTTP listener
        listener = New HttpListener()
        listener.Prefixes.Add("http://localhost:5000/")

        Try
            ' Start the listener
            listener.Start()
            Console.WriteLine("Server started. Listening on http://localhost:5000/")

            ' Set the running flag
            isRunning = True
            
            ' Start handling requests
            Dim listenerThread As New Thread(AddressOf HandleRequests)
            listenerThread.IsBackground = True
            listenerThread.Start()

        Catch ex As Exception
            Console.WriteLine($"Error starting server: {ex.Message}")
        End Try
    End Sub

    Public Sub [Stop]()
        isRunning = False
        If listener IsNot Nothing Then
            listener.Stop()
        End If
    End Sub

    Private Sub HandleRequests()
        While isRunning
            Try
                ' Wait for a request
                Dim context As HttpListenerContext = listener.GetContext()

                ' Process the request in a new thread
                Dim requestThread As New Thread(Sub() ProcessRequest(context))
                requestThread.IsBackground = True
                requestThread.Start()

            Catch ex As Exception
                If isRunning Then
                    Console.WriteLine($"Error handling request: {ex.Message}")
                End If
            End Try
        End While
    End Sub

    Private Sub ProcessRequest(ByVal context As HttpListenerContext)
        Dim response As HttpListenerResponse = Nothing
        Dim responseString As String = ""
        
        Try
            Dim request As HttpListenerRequest = context.Request
            response = context.Response
            
            ' Set CORS headers
            response.AddHeader("Access-Control-Allow-Origin", "*")
            response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

            ' Handle preflight OPTIONS request
            If request.HttpMethod = "OPTIONS" Then
                response.StatusCode = 200
                response.Close()
                Return
            End If

            ' Get the request path
            Dim path As String = request.Url.AbsolutePath.ToLower()
            Console.WriteLine($"Received request: {request.HttpMethod} {path}")

            Select Case path
                Case "/status"
                    ' Check if the scanner is initialized
                    If _biometric IsNot Nothing Then
                        responseString = JsonSerializer.Serialize(New With {.success = True, .message = "Scanner is initialized"})
                    Else
                        responseString = JsonSerializer.Serialize(New With {.success = False, .message = "Scanner is not initialized"})
                    End If

                Case "/initialize"
                    ' Initialize the scanner
                    _biometric = New Biometric()
                    _biometric.OnStatusChange(Sub(status)
                                                  Console.WriteLine($"Status: {status}")
                                              End Sub)
                    _biometric.Initialize(Nothing)
                    responseString = JsonSerializer.Serialize(New With {.success = True, .message = "Scanner initialized. Ready to scan"})

                Case "/capture"
                    Console.WriteLine("Processing capture request...")
                    
                    ' Check if scanner is initialized
                    If _biometric Is Nothing Then
                        responseString = JsonSerializer.Serialize(New With {.success = False, .message = "Scanner not initialized. Please initialize first."})
                    Else
                        ' Set up a callback to handle the captured fingerprint
                        Dim captureComplete As New ManualResetEvent(False)
                        Dim captureSuccess As Boolean = False
                        Dim captureData As String = ""
                        Dim captureMessage As String = "Timeout waiting for fingerprint"
                        
                        ' Set the callback for when fingerprint is captured
                        Console.WriteLine("Registering fingerprint callback...")
                        _biometric.OnFingerPrint(Sub(result)
                                                    Console.WriteLine("Fingerprint callback triggered")
                                                    captureData = result
                                                    captureSuccess = True
                                                    captureMessage = "Fingerprint captured successfully"
                                                    captureComplete.Set()
                                                End Sub)
                        
                        ' Start the capture process
                        Console.WriteLine("Starting fingerprint capture...")
                        _biometric.ReadBiometric()
                        
                        ' Wait for the capture to complete with a timeout
                        Dim timeoutMs As Integer = 30000 ' 30 seconds
                        Console.WriteLine($"Waiting for capture to complete (timeout: {timeoutMs}ms)...")
                        Dim signaled As Boolean = captureComplete.WaitOne(timeoutMs)
                        
                        If signaled AndAlso captureSuccess Then
                            Console.WriteLine("Capture successful, preparing response...")
                            responseString = JsonSerializer.Serialize(New With {
                                .success = True,
                                .message = captureMessage,
                                .data = captureData
                            })
                            Console.WriteLine("Capture successful, sending response")
                        Else
                            Console.WriteLine("Capture failed or timed out")
                            responseString = JsonSerializer.Serialize(New With {
                                .success = False,
                                .message = "Failed to capture fingerprint or timeout occurred"
                            })
                        End If
                    End If
                    
                Case "/verify"
                    ' Verify a fingerprint
                    Dim reader As New StreamReader(request.InputStream, request.ContentEncoding)
                    Dim requestBody As String = reader.ReadToEnd()
                    
                    ' Parse the request body to get the fingerprint data and employee ID
                    Dim requestData = JsonSerializer.Deserialize(Of Dictionary(Of String, Object))(requestBody)
                    
                    If requestData.ContainsKey("fingerprintData") AndAlso requestData.ContainsKey("employeeId") Then
                        Dim storedTemplate As String = GetStoredTemplate(requestData("employeeId").ToString())
                        
                        If Not String.IsNullOrEmpty(storedTemplate) Then
                            ' Compare the fingerprints
                            Dim score As Integer = _biometric.CompareFingerPrint(storedTemplate, _biometric.Result)
                            Dim isMatch As Boolean = (score >= 12000) ' Threshold for match
                            
                            responseString = JsonSerializer.Serialize(New With {
                                .success = isMatch,
                                .message = If(isMatch, "Fingerprint verified successfully", "Fingerprint verification failed"),
                                .score = score
                            })
                        Else
                            responseString = JsonSerializer.Serialize(New With {
                                .success = False,
                                .message = "No stored template found for this employee"
                            })
                        End If
                    Else
                        responseString = JsonSerializer.Serialize(New With {
                            .success = False,
                            .message = "Invalid request data"
                        })
                    End If
                    
                Case "/register"
                    ' Register a fingerprint
                    Dim reader As New StreamReader(request.InputStream, request.ContentEncoding)
                    Dim requestBody As String = reader.ReadToEnd()
                    
                    ' Parse the request body to get the fingerprint data and employee ID
                    Dim requestData = JsonSerializer.Deserialize(Of Dictionary(Of String, Object))(requestBody)
                    
                    If requestData.ContainsKey("fingerprintData") AndAlso requestData.ContainsKey("employeeId") Then
                        ' Store the template
                        Dim success As Boolean = StoreTemplate(requestData("employeeId").ToString(), requestData("fingerprintData").ToString())
                        
                        responseString = JsonSerializer.Serialize(New With {
                            .success = success,
                            .message = If(success, "Fingerprint registered successfully", "Failed to register fingerprint")
                        })
                    Else
                        responseString = JsonSerializer.Serialize(New With {
                            .success = False,
                            .message = "Invalid request data"
                        })
                    End If
                    
                Case Else
                    ' Unknown endpoint
                    response.StatusCode = 404
                    responseString = JsonSerializer.Serialize(New With {
                        .success = False,
                        .message = "Endpoint not found"
                    })
            End Select
            
        Catch ex As Exception
            ' Handle any errors
            If response IsNot Nothing Then
                response.StatusCode = 500
                responseString = JsonSerializer.Serialize(New With {
                    .success = False,
                    .message = $"Server error: {ex.Message}"
                })
            End If
        Finally
            ' Send the response
            If response IsNot Nothing Then
                Try
                    response.ContentType = "application/json"
                    Dim buffer As Byte() = Encoding.UTF8.GetBytes(responseString)
                    response.ContentLength64 = buffer.Length
                    response.OutputStream.Write(buffer, 0, buffer.Length)
                    response.Close()
                Catch ex As Exception
                    Console.WriteLine($"Error sending response: {ex.Message}")
                End Try
            End If
        End Try
    End Sub
    
    ' Helper function to get a stored template (in a real app, this would use a database)
    Private Function GetStoredTemplate(employeeId As String) As String
        Dim templatesDir As String = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "templates")
        Dim templateFile As String = Path.Combine(templatesDir, $"{employeeId}.template")
        
        If File.Exists(templateFile) Then
            Return File.ReadAllText(templateFile)
        End If
        
        Return Nothing
    End Function
    
    ' Helper function to store a template (in a real app, this would use a database)
    Private Function StoreTemplate(employeeId As String, template As String) As Boolean
        Try
            Dim templatesDir As String = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "templates")
            
            ' Create the directory if it doesn't exist
            If Not Directory.Exists(templatesDir) Then
                Directory.CreateDirectory(templatesDir)
            End If
            
            Dim templateFile As String = Path.Combine(templatesDir, $"{employeeId}.template")
            File.WriteAllText(templateFile, template)
            
            Return True
        Catch ex As Exception
            Console.WriteLine($"Error storing template: {ex.Message}")
            Return False
        End Try
    End Function
End Class 