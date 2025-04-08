import { McpError } from '@modelcontextprotocol/sdk/types.js';

export interface ToolError {
  content: [{
    type: 'text',
    text: string
  }],
  isError: true
}

export interface ToolSuccess {
  content: [{
    type: 'text',
    text: string
  }],
  isError?: false
}

export type ToolResult = ToolSuccess | ToolError;

// Interface for describing a tool to the MCP client
export interface ToolInfo {
    name: string;
    description: string;
    inputSchema: Record<string, any>; // Use a generic object for schema for now
}

// Define specific argument types for each tool
export interface FetchRecordArgs {
  collection: string;
  id: string;
}

export interface ListRecordsArgs {
  collection: string;
  page?: number;
  perPage?: number;
  filter?: string;
  sort?: string;
  expand?: string;
}

export interface CreateRecordArgs {
  collection: string;
  data: any;
}

export interface UpdateRecordArgs {
  collection: string;
  id: string;
  data: any;
}

export interface GetCollectionSchemaArgs {
  collection: string;
}

export interface UploadFileArgs {
  collection: string;
  recordId: string;
  fileField: string;
  fileContent: string;
  fileName: string;
}

export interface DownloadFileArgs {
  collection: string;
  recordId: string;
  fileField: string;
  downloadPath: string;
}

export interface ListCollectionsArgs {} // No arguments

// Add types for new migration tools later
