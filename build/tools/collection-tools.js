import { invalidParamsError } from '../server/error-handler.js';
// Define tool information
const collectionToolInfo = [
    {
        name: 'get_collection_schema',
        description: 'Get the schema (fields, rules, etc.) of a PocketBase collection.',
        inputSchema: {
            type: 'object',
            properties: {
                collection: { type: 'string', description: 'The name or ID of the PocketBase collection.' },
            },
            required: ['collection'],
        },
    },
    {
        name: 'list_collections',
        description: 'List all collections in the PocketBase instance.',
        inputSchema: {
            type: 'object',
            properties: {}, // No arguments needed
            additionalProperties: false,
        },
    },
];
export function listCollectionTools() {
    return collectionToolInfo;
}
// Handle calls for collection-related tools
export async function handleCollectionToolCall(name, args, pb) {
    switch (name) {
        case 'get_collection_schema':
            return getCollectionSchema(args, pb);
        case 'list_collections':
            // No args expected for list_collections, but pass anyway for consistency
            return listCollections(args, pb);
        default:
            throw new Error(`Unknown collection tool: ${name}`);
    }
}
// --- Individual Tool Implementations ---
async function getCollectionSchema(args, pb) {
    if (!args.collection) {
        throw invalidParamsError("Missing required argument: collection");
    }
    const schema = await pb.collections.getOne(args.collection);
    return {
        content: [{ type: 'text', text: JSON.stringify(schema, null, 2) }],
    };
}
async function listCollections(args, pb) {
    // Args are ignored for this tool
    const result = await pb.collections.getFullList({ sort: '-created' });
    return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
}
