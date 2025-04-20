module.exports = {
  run: [
    // Clone the LightRAG repository only if it doesn't exist
    {
      method: "shell.run",
      params: {
        message: [
          "echo '🔍 Checking for existing LightRAG repository...'",
          "[ -d LightRAG ] || git clone https://github.com/HKUDS/LightRAG"
        ],
        onError: { // Add error handling for git clone failure
          message: "Failed to clone LightRAG repository. Please check your internet connection and Git setup.",
        }
      }
    },
    // Create necessary directories using fs.mkdir for cross-platform compatibility
    {
      method: "fs.mkdir",
      params: {
        path: "{{env.INPUT_DIR}}"
      }
    },
    {
      method: "fs.mkdir",
      params: {
        path: "{{env.WORKING_DIR}}"
      }
    },
    {
      method: "fs.mkdir",
      params: {
        // Create nested directories step-by-step if fs.mkdir doesn't handle recursive creation
        // Assuming {{cwd}} is the project root (LightRAG-Pinokio)
        path: "LightRAG/lightrag"
      }
    },
     {
      method: "fs.mkdir",
      params: {
        path: "LightRAG/lightrag/api"
      }
    },
    {
      method: "fs.mkdir",
      params: {
        path: "LightRAG/lightrag/api/webui"
      }
    },
    // Create .env file from ENVIRONMENT settings
    {
      method: "fs.write",
      params: {
        path: "LightRAG/.env",
        content: `### Server Configuration
HOST={{env.HOST}}
PORT={{env.PORT}}
WEBUI_TITLE='{{env.WEBUI_TITLE}}'
WEBUI_DESCRIPTION="{{env.WEBUI_DESCRIPTION}}"

### Directory Configuration
WORKING_DIR={{env.WORKING_DIR}}
INPUT_DIR={{env.INPUT_DIR}}

### Logging level
LOG_LEVEL=INFO

### Settings for RAG query
HISTORY_TURNS=3
TOP_K=60

### Settings for document indexing
SUMMARY_LANGUAGE=English
CHUNK_SIZE=1200
CHUNK_OVERLAP_SIZE=100

### LLM Configuration
TIMEOUT=150
TEMPERATURE=0.5
MAX_ASYNC=4
MAX_TOKENS=32768
ENABLE_LLM_CACHE=true
ENABLE_LLM_CACHE_FOR_EXTRACT=true

### Ollama configuration
LLM_BINDING={{env.LLM_BINDING}}
LLM_MODEL={{env.LLM_MODEL}}
LLM_BINDING_HOST={{env.LLM_BINDING_HOST}}

### Embedding Configuration
EMBEDDING_BINDING={{env.EMBEDDING_BINDING}}
EMBEDDING_MODEL={{env.EMBEDDING_MODEL}}
EMBEDDING_DIM={{env.EMBEDDING_DIM}}
EMBEDDING_BINDING_HOST={{env.EMBEDDING_BINDING_HOST}}

### Data storage selection
LIGHTRAG_KV_STORAGE={{env.LIGHTRAG_KV_STORAGE}}
LIGHTRAG_VECTOR_STORAGE={{env.LIGHTRAG_VECTOR_STORAGE}}
LIGHTRAG_GRAPH_STORAGE={{env.LIGHTRAG_GRAPH_STORAGE}}
LIGHTRAG_DOC_STATUS_STORAGE={{env.LIGHTRAG_DOC_STATUS_STORAGE}}`
      }
    },
    // Create Python virtual environment
    {
      method: "shell.run",
      params: {
        message: [
          "echo '🐍 Creating Python virtual environment...'",
          "python -m venv env"
        ]
      }
    },
    // Install LightRAG with API support in the virtual environment
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "LightRAG",
        message: [
          "echo '📦 Installing LightRAG with API support...'",
          "pip install -e \".[api]\""
        ]
      }
    },
    // Check if Ollama is installed and pull required models
    {
      method: "shell.run",
      params: {
        message: [
          "echo '🤖 Checking Ollama installation...'",
          "ollama list || (echo '⚠️ WARNING: Ollama not found. Please install Ollama from https://ollama.com/' && exit 0)",
          "echo '📥 Pulling required Ollama models...'",
          "ollama pull {{env.EMBEDDING_MODEL}} || echo '⚠️ WARNING: Failed to pull embedding model'",
          "ollama pull {{env.LLM_MODEL}} || echo '⚠️ WARNING: Failed to pull LLM model'"
        ]
      }
    },
    // Check if Bun is installed, attempt install via PowerShell if missing (Windows specific)
    {
      method: "shell.run",
      params: {
        // Use script for multi-line logic and conditional execution
        script: [
          "echo 'Checking for Bun installation...'",
          "bun --version", // Check if bun is already available
          "if [ $? -ne 0 ]; then", // $? holds the exit code of the last command
          "  echo 'Bun not found, attempting to install using PowerShell (Windows)...'",
          // Execute PowerShell command to install Bun
          "  powershell -c "irm bun.sh/install.ps1|iex"",
          "  if [ $? -ne 0 ]; then", // Check if PowerShell command failed
          "    echo 'ERROR: Failed to install Bun using PowerShell.'",
          "    echo 'Please install Bun manually (https://bun.sh/docs/installation) and ensure it is in your PATH.'",
          "    exit 1", // Exit script if installation fails
          "  else",
          "    echo 'Bun installation attempt finished. Verifying installation...'",
          "    bun --version", // Verify installation
           "   if [ $? -ne 0 ]; then",
           "      echo 'ERROR: Bun installed but command still not found. Ensure C:\Users\<YourUsername>\.bun\bin is in your PATH.'",
           "      echo 'You may need to restart Pinokio or your terminal.'",
           "      exit 1",
           "   else",
           "      echo 'Bun verified successfully.'",
           "   fi",
          "  fi",
          "else",
          "  echo 'Bun is already installed.'",
          "fi"
        ].join("\n"), // Join lines with newline for the script
        onError: { // Catch errors from the shell.run step itself
          message: "An error occurred during the Bun check/installation process. Please check the logs.",
        }
      }
    },
    // Install WebUI dependencies using Bun
    {
      method: "shell.run",
      params: {
        path: "LightRAG/lightrag_webui",
        message: [
          "echo '🌐 Installing WebUI dependencies using Bun...'",
          "bun install --frozen-lockfile"
        ]
      }
    },
    // Build the WebUI using Bun
    {
      method: "shell.run",
      params: {
        path: "LightRAG/lightrag_webui",
        message: [
          "echo '🔨 Building the WebUI using Bun...'",
          "bun run build --emptyOutDir"
        ]
      }
    },
    // Copy the built WebUI to the expected location
    {
      method: "shell.run",
      params: {
        path: "LightRAG",
        // Use robocopy for more robust file copying on Windows
        message: [
          "echo '📋 Copying WebUI files to API directory...'",
          "robocopy lightrag_webui\dist lightrag\api\webui /E /NFL /NDL /NJH /NJS /nc /ns /np",
          // Check robocopy exit code (0-7 indicate success)
          "if %errorlevel% GEQ 8 (echo '⚠️ WARNING: Could not copy WebUI files. Robocopy error code: %errorlevel%' && exit /b 0) else (echo 'WebUI files copied successfully.')"
        ],
         // Add onError for shell command execution failure
        onError: {
            message: "Failed to execute the command to copy WebUI files."
        }
      }
    },
    {
      method: "notify",
      params: {
        html: "LightRAG installation complete! Click the 'Start Server' tab to launch the server."
      }
    }
  ]
} 