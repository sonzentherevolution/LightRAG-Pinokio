module.exports = {
  run: [
    // Clone the LightRAG repository
    {
      method: "shell.run",
      params: {
        message: [
          "echo '🔍 Cloning LightRAG repository...'",
          "git clone https://github.com/HKUDS/LightRAG"
        ]
      }
    },
    // Create necessary directories
    {
      method: "shell.run",
      params: {
        path: "LightRAG",
        message: [
          "echo '📁 Creating directories...'",
          "mkdir -p {{env.INPUT_DIR}} {{env.WORKING_DIR}}",
          "mkdir -p lightrag/api/webui"
        ]
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
    // Check if Bun is installed, attempt install via npm if missing
    {
      method: "shell.run",
      params: {
        script: [
          "echo 'Checking for Bun installation...'",
          "bun --version",
          "if [ $? -ne 0 ]; then",
          "  echo 'Bun not found, attempting to install via npm...'",
          "  npm install -g bun",
          "  if [ $? -ne 0 ]; then",
          "    echo 'ERROR: Failed to install Bun using npm.'",
          "    exit 1",
          "  else",
          "    echo 'Bun installed successfully via npm.'",
          "    bun --version || (echo 'ERROR: Bun installed but still not found in PATH?' && exit 1)",
          "  fi",
          "fi"
        ].join("\n"),
        onError: {
          message: "Failed to verify or install Bun. Please install Bun manually (https://bun.sh/docs/installation) and try again.",
          href: "https://bun.sh/docs/installation"
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
        message: [
          "echo '📋 Copying WebUI files to API directory...'",
          "mkdir -p lightrag/api/webui",
          "cp -r lightrag_webui/dist/* lightrag/api/webui/ || echo '⚠️ WARNING: Could not copy WebUI files'"
        ]
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