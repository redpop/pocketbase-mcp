#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import PocketBase from 'pocketbase';

const API_URL = process.env.POCKETBASE_API_URL || 'http://127.0.0.1:8090';
const ADMIN_TOKEN = process.env.POCKETBASE_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  throw new Error('POCKETBASE_ADMIN_TOKEN environment variable is required');
}

interface ToolError {
    content: [{
        type: 'text',
        text: string
    }],
    isError: true
}

class PocketBaseServer {
  private server: Server;
  private pb: PocketBase;

  constructor() {
    this.server = new Server(
      {
        name: 'pocketbase-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.pb = new PocketBase(API_URL);
    if (ADMIN_TOKEN) {
        this.pb.authStore.save(ADMIN_TOKEN, null);
    }

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = (error: Error) => { console.error('[MCP Error]', error) };
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'fetch_record',
          description: 'Fetch a single record from a PocketBase collection by ID.',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'The name of the PocketBase collection.',
              },
              id: {
                type: 'string',
                description: 'The ID of the record to fetch.',
              },
            },
            required: ['collection', 'id'],
          },
        },
        {
          name: 'list_records',
          description: 'List records from a PocketBase collection. Supports pagination using `page` and `perPage` parameters.',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'The name of the PocketBase collection.',
              },
              page: {
                type: 'number',
                description: 'Page number (defaults to 1).',
                minimum: 1
              },
              perPage: {
                type: 'number',
                description: 'Items per page (defaults to 25).',
                minimum: 1,
                maximum: 100
              },
              filter: {
                type: 'string',
                description: 'Filter string for the PocketBase query.'
              },
              sort: {
                type: 'string',
                description: 'Sort string for the PocketBase query (e.g., "fieldName,-otherFieldName").'
              },
              expand: {
                type: 'string',
                description: 'Expand string for the PocketBase query (e.g., "relation1,relation2.subRelation").'
              }
            },
            required: ['collection'],
          },
        },
        {
          name: 'create_record',
          description: 'Create a new record in a PocketBase collection.',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'The name of the PocketBase collection.',
              },
              data: {
                type: 'object',
                description: 'The data for the new record.',
                additionalProperties: true
              },
            },
            required: ['collection', 'data'],
          },
        },
        {
          name: 'update_record',
          description: 'Update an existing record in a PocketBase collection.',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'The name of the PocketBase collection.',
              },
              id: {
                type: 'string',
                description: 'The ID of the record to update.',
              },
              data: {
                type: 'object',
                description: 'The data to update.',
                additionalProperties: true
              },
            },
            required: ['collection', 'id', 'data'],
          },
        },
        {
          name: 'get_collection_schema',
          description: 'Get the schema of a PocketBase collection.',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'The name of the PocketBase collection.',
              },
            },
            required: ['collection'],
          },
        },
        {
          name: 'upload_file',
          description: 'Upload a file to a PocketBase collection record.',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'The name of the PocketBase collection.',
              },
              recordId: {
                type: 'string',
                description: 'The ID of the record to upload the file to.',
              },
              fileField: {
                type: 'string',
                description: 'The name of the file field in the PocketBase collection.',
              },
              fileContent: {
                type: 'string',
                description: 'The content of the file to upload.',
              },
              fileName: {
                type: 'string',
                description: 'The name of the file.',
              }
            },
            required: [
              "collection",
              "recordId",
              "fileField",
              "fileContent",
              "fileName"
            ]
          },
        },
        {
          name: 'list_collections',
          description: 'List all collections in the PocketBase instance.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: 'download_file',
          description: 'Download a file from a PocketBase collection record.',
          inputSchema: {
            type: 'object',
            properties: {
              collection: {
                type: 'string',
                description: 'The name of the PocketBase collection.',
              },
              recordId: {
                type: 'string',
                description: 'The ID of the record to download the file from.',
              },
              fileField: {
                type: 'string',
                description: 'The name of the file field in the PocketBase collection.',
              },
              downloadPath: {
                type: 'string',
                description: 'The path where the downloaded file should be saved.',
              },
            },
            required: [
              "collection",
              "recordId",
              "fileField",
              "downloadPath"
            ]
          }
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'fetch_record': {
            if (!args || typeof args !== 'object' || !('collection' in args) || !('id' in args)) {
              throw new McpError(ErrorCode.InvalidParams, "Missing collection or id");
            }
            const { collection, id } = args as { collection: string; id: string; };
            const record = await this.pb.collection(collection).getOne(id);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(record, null, 2),
                },
              ],
            };
          }
          case 'list_records': {
            if (!args || typeof args !== 'object' || !('collection' in args)) {
              throw new McpError(ErrorCode.InvalidParams, "Missing collection");
            }
            const { collection, page, perPage, filter, sort, expand } = args as { collection: string; page?: number; perPage?: number; filter?: string; sort?: string; expand?: string; };
            const result = await this.pb.collection(collection).getList(page || 1, perPage || 25, {
                filter,
                sort,
                expand
            });
            return {
              content: [
                {
                  type: 'text',
                  content: result,
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }
          case 'create_record': {
            if (!args || typeof args !== 'object' || !('collection' in args) || !('data' in args)) {
              throw new McpError(ErrorCode.InvalidParams, "Missing collection or data");
            }
            const { collection, data } = args as {collection: string, data: any};
            const record = await this.pb.collection(collection).create(data);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(record, null, 2),
                },
              ],
            };
          }
          case 'update_record': {
            if (!args || typeof args !== 'object' || !('collection' in args) || !('id' in args) || !('data' in args)) {
              throw new McpError(ErrorCode.InvalidParams, "Missing collection, id, or data");
            }
            const { collection, id, data } = args as {collection: string, id: string, data: any};
            const record = await this.pb.collection(collection).update(id, data);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(record, null, 2),
                },
              ],
            };
          }
          case 'get_collection_schema': {
            if (!args || typeof args !== 'object' || !('collection' in args)) {
              throw new McpError(ErrorCode.InvalidParams, "Missing collection");
            }
            const { collection } = args as { collection: string };
            const schema = await this.pb.collections.getOne(collection);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(schema, null, 2),
                },
              ],
            };
          }
          case 'upload_file': {
            if (!args || typeof args !== 'object' || !('collection' in args) || !('recordId' in args) || !('fileField' in args) || !('fileContent' in args) || !('fileName' in args)) {
              throw new McpError(ErrorCode.InvalidParams, "Missing collection, recordId, fileField, fileContent, or fileName");
            }
            const { collection, recordId, fileField, fileContent, fileName } = args as { collection: string; recordId: string; fileField: string; fileContent: string; fileName: string };

            // Create a Blob from the file content
            const blob = new Blob([fileContent]);

            // Create a FormData object and append the file
            const formData = new FormData();
            formData.append(fileField, blob, fileName);

            // Update the record with the file
            const record = await this.pb.collection(collection).update(recordId, formData);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(record, null, 2),
                },
              ],
            };
          }
          case 'download_file': {
            if (!args || typeof args !== 'object' || !('collection' in args) || !('recordId' in args) || !('fileField' in args) || !('downloadPath' in args)) {
              throw new McpError(ErrorCode.InvalidParams, "Missing collection, recordId, fileField, or downloadPath");
            }
            const { collection, recordId, fileField, downloadPath } = args as { collection: string; recordId: string; fileField: string; downloadPath: string; };

            // Fetch the record
            const record = await this.pb.collection(collection).getOne(recordId);

            // Get the file URL
            const fileUrl = this.pb.getFileUrl(record, record[fileField]);

            // Return the file URL to the user. They can use this URL to download the file.
            return {
              content: [
                {
                  type: 'text',
                  text: fileUrl
                }
              ]
            };

            // The following code is not possible because we cannot download files within the MCP server
            // // Download the file content
            // const response = await fetch(fileUrl);
            // const fileContent = await response.text();

            // // Save the file using the write_to_file tool
            // await write_to_file({ path: downloadPath, content: fileContent });

            // return {
            //   content: [
            //     {
            //       type: 'text',
            //       text: `File downloaded to ${downloadPath}`,
            //     },
            //   ],
            // };
          }
          case 'list_collections': {
            const result = await this.pb.collections.getFullList({ sort: '-created' });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error: unknown) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return {
          content: [{
            type: 'text',
            text: errorMessage,
          }],
          isError: true
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PocketBase MCP server running on stdio');
  }
}

const server = new PocketBaseServer();
server.run().catch(console.error);
