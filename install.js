module.exports = {
  run: [
    // Clone the LightRAG repository
    {
      method: "shell.run",
      params: {
        message: "git clone https://github.com/HKUDS/LightRAG"
      }
    },
    // Create necessary directories
    {
      method: "shell.run",
      params: {
        path: "LightRAG",
        message: "mkdir -p {{env.INPUT_DIR}} {{env.WORKING_DIR}}"
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
        message: "python -m venv env"
      }
    },
    // Install LightRAG with API support in the virtual environment
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "LightRAG",
        message: "pip install -e \".[api]\""
      }
    },
    // Check if Ollama is installed and pull required models
    {
      method: "shell.run",
      params: {
        message: [
          "echo 'Checking Ollama installation...'",
          "ollama list || (echo '⚠️ WARNING: Ollama not found. Please install Ollama from https://ollama.com/' && exit 0)",
          "echo 'Pulling required Ollama models...'",
          "ollama pull {{env.EMBEDDING_MODEL}} || echo '⚠️ WARNING: Failed to pull embedding model'",
          "ollama pull {{env.LLM_MODEL}} || echo '⚠️ WARNING: Failed to pull LLM model'"
        ]
      }
    },
    // Build the WebUI
    {
      method: "shell.run",
      params: {
        path: "LightRAG/lightrag_webui",
        message: [
          "echo 'Building LightRAG WebUI...'",
          "npm install || echo '⚠️ WARNING: Failed to install WebUI dependencies with npm, trying bun...'",
          "bunx --bun vite build || npm run build-no-bun || echo '⚠️ WARNING: Failed to build WebUI'"
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