module.exports = {
  daemon: true,
  run: [
    // Start the LightRAG server within the Python virtual environment
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "LightRAG",
        message: "lightrag-server",
        on: [{
          // Pattern to look for in the server output to know when it's ready
          "event": "/Server is ready to accept connections/",
          "done": true
        }]
      }
    },
    // Set the URL for the WebUI tab
    {
      method: "local.set",
      params: {
        url: "http://localhost:{{env.PORT}}"
      }
    },
    {
      method: "notify",
      params: {
        html: "LightRAG server is running! Click the 'Open WebUI' tab to access the interface."
      }
    }
  ]
} 