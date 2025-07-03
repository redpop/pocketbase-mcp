import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ToolError } from '../types/tool-types.js'; // Import directly from tool-types

/**
 * Formats an error into the standard MCP ToolError structure.
 * @param error The error object or message.
 * @param defaultCode The default ErrorCode to use if the error is not an McpError.
 * @returns A ToolError object.
 */
export function formatError(error: unknown, defaultCode: ErrorCode = ErrorCode.InternalError): ToolError {
  console.error('[MCP Server Error]', error); // Log the full error internally

  let message: string;
  let code: ErrorCode;

  if (error instanceof McpError) {
    message = error.message;
    code = error.code;
  } else if (error instanceof Error) {
    message = error.message;
    code = defaultCode;
  } else {
    message = 'An unknown error occurred';
    code = ErrorCode.InternalError; // Use InternalError as fallback
  }

  // You could add more specific error handling here, e.g., for PocketBase errors

  return {
    content: [{
      type: 'text',
      text: `Error (${ErrorCode[code]}): ${message}`, // Include error code name for clarity
    }],
    isError: true,
  };
}

/**
 * Creates a standard McpError for invalid parameters.
 * @param message The specific error message.
 * @returns An McpError object.
 */
export function invalidParamsError(message: string): McpError {
    return new McpError(ErrorCode.InvalidParams, message);
}

/**
 * Creates a standard McpError for method not found.
 * @param toolName The name of the tool that was not found.
 * @returns An McpError object.
 */
export function methodNotFoundError(toolName: string): McpError {
    return new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
}
