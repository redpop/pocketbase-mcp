# PocketBase MCP Server

This is an MCP server that interacts with a PocketBase instance. It allows you to fetch, list, create, update, and manage records and files in your PocketBase collections.

## Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository_url>
    cd pocketbase-mcp
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Build the server:**
    ```bash
    npm run build
    ```
    This compiles the TypeScript code to JavaScript in the `build/` directory and makes the entry point executable.

## Configuration

This server requires the following environment variables to be set:

-   `POCKETBASE_API_URL`: The URL of your PocketBase instance (e.g., `http://127.0.0.1:8090`). Defaults to `http://127.0.0.1:8090` if not set.
-   `POCKETBASE_ADMIN_TOKEN`: An admin authentication token for your PocketBase instance. **This is required.** You can generate this from your PocketBase admin UI.

These variables need to be configured when adding the server to Cline (see Cline Installation section).

## Available Tools

The server provides the following tools:

-   **fetch_record**: Fetch a single record from a PocketBase collection by ID.
    -   *Input Schema*:
        ```json
        {
          "type": "object",
          "properties": {
            "collection": {
              "type": "string",
              "description": "The name of the PocketBase collection."
            },
            "id": {
              "type": "string",
              "description": "The ID of the record to fetch."
            }
          },
          "required": [
            "collection",
            "id"
          ]
        }
        ```

-   **list_records**: List records from a PocketBase collection. Supports pagination, filtering, sorting, and expanding relations.
    -   *Input Schema*:
        ```json
        {
          "type": "object",
          "properties": {
            "collection": {
              "type": "string",
              "description": "The name of the PocketBase collection."
            },
            "page": {
              "type": "number",
              "description": "Page number (defaults to 1).",
              "minimum": 1
            },
            "perPage": {
              "type": "number",
              "description": "Items per page (defaults to 25).",
              "minimum": 1,
              "maximum": 100
            },
            "filter": {
              "type": "string",
              "description": "Filter string for the PocketBase query."
            },
            "sort": {
              "type": "string",
              "description": "Sort string for the PocketBase query (e.g., \\"fieldName,-otherFieldName\\")."
            },
            "expand": {
              "type": "string",
              "description": "Expand string for the PocketBase query (e.g., \\"relation1,relation2.subRelation\\")."
            }
          },
          "required": [
            "collection"
          ]
        }
        ```

-   **create_record**: Create a new record in a PocketBase collection.
    -   *Input Schema*:
        ```json
        {
          "type": "object",
          "properties": {
            "collection": {
              "type": "string",
              "description": "The name of the PocketBase collection."
            },
            "data": {
              "type": "object",
              "description": "The data for the new record.",
              "additionalProperties": true
            }
          },
          "required": [
            "collection",
            "data"
          ]
        }
        ```

-   **update_record**: Update an existing record in a PocketBase collection.
    -   *Input Schema*:
        ```json
        {
          "type": "object",
          "properties": {
            "collection": {
              "type": "string",
              "description": "The name of the PocketBase collection."
            },
            "id": {
              "type": "string",
              "description": "The ID of the record to update."
            },
            "data": {
              "type": "object",
              "description": "The data to update.",
              "additionalProperties": true
            }
          },
          "required": [
            "collection",
            "id",
            "data"
          ]
        }
        ```

-   **get_collection_schema**: Get the schema of a PocketBase collection.
    -   *Input Schema*:
        ```json
        {
          "type": "object",
          "properties": {
            "collection": {
              "type": "string",
              "description": "The name of the PocketBase collection."
            }
          },
          "required": [
            "collection"
          ]
        }
        ```

-   **upload_file**: Upload a file to a specific field in a PocketBase collection record.
    -   *Input Schema*:
        ```json
        {
          "type": "object",
          "properties": {
            "collection": {
              "type": "string",
              "description": "The name of the PocketBase collection."
            },
            "recordId": {
              "type": "string",
              "description": "The ID of the record to upload the file to."
            },
            "fileField": {
              "type": "string",
              "description": "The name of the file field in the PocketBase collection."
            },
            "fileContent": {
              "type": "string",
              "description": "The content of the file to upload."
            },
            "fileName": {
              "type": "string",
              "description": "The name of the file."
            }
          },
          "required": [
            "collection",
            "recordId",
            "fileField",
            "fileContent",
            "fileName"
          ]
        }
        ```

-   **list_collections**: List all collections in the PocketBase instance.
    -   *Input Schema*:
        ```json
        {
          "type": "object",
          "properties": {},
          "additionalProperties": false
        }
        ```

-   **download_file**: Get the download URL for a file stored in a PocketBase collection record.
    -   *Input Schema*:
        ```json
        {
          "type": "object",
          "properties": {
            "collection": {
              "type": "string",
              "description": "The name of the PocketBase collection."
            },
            "recordId": {
              "type": "string",
              "description": "The ID of the record to download the file from."
            },
            "fileField": {
              "type": "string",
              "description": "The name of the file field in the PocketBase collection."
            },
            "downloadPath": {
              "type": "string",
              "description": "The path where the downloaded file should be saved (Note: This tool currently returns the URL, download must be handled separately)."
            }
          },
          "required": [
            "collection",
            "recordId",
            "fileField",
            "downloadPath"
          ]
        }
        ```
        *Note: This tool returns the file URL. The actual download needs to be performed by the client using this URL.*

## Cline Installation

To use this server with Cline, you need to add it to your MCP settings file (`cline_mcp_settings.json`).

1.  **Locate your Cline MCP settings file:**
    *   Typically found at `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` on Linux/macOS.
    *   Or `~/Library/Application Support/Claude/claude_desktop_config.json` if using the Claude desktop app on macOS.

2.  **Edit the file and add the following configuration under the `mcpServers` key.** Replace `/path/to/pocketbase-mcp` with the actual absolute path to this project directory on your system. Also, replace `<YOUR_POCKETBASE_API_URL>` and `<YOUR_POCKETBASE_ADMIN_TOKEN>` with your actual PocketBase URL and admin token.

    ```json
    {
      "mcpServers": {
        // ... other servers might be listed here ...

        "pocketbase-mcp": {
          "command": "node",
          "args": ["/path/to/pocketbase-mcp/build/index.js"],
          "env": {
            "POCKETBASE_API_URL": "<YOUR_POCKETBASE_API_URL>", // e.g., "http://127.0.0.1:8090"
            "POCKETBASE_ADMIN_TOKEN": "<YOUR_POCKETBASE_ADMIN_TOKEN>"
          },
          "disabled": false, // Ensure it's enabled
          "autoApprove": [] // Default auto-approve settings
        }

        // ... other servers might be listed here ...
      }
    }
    ```

3.  **Save the settings file.** Cline should automatically detect the changes and connect to the server. You can then use the tools listed above.

## Dependencies

-   `@modelcontextprotocol/sdk`
-   `pocketbase`
-   `typescript`
-   `ts-node` (dev dependency)
-   `@types/node` (dev dependency)
