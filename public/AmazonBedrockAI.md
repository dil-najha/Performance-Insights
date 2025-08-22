import { config } from "dotenv";
import { fromEnv } from "@aws-sdk/credential-providers";
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
 
// Load environment variables from .env file
config();
 
 
/**
* AWS Bedrock Client for AI model invocation
*
* This module provides functionality to invoke AI models through AWS Bedrock,
* specifically optimized for Anthropic Claude models used in test case generation.
*
* Invokes Anthropic Claude 3 using the Messages API.
*
* To learn more about the Anthropic Messages API, go to:
* https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages.html
*
* @param {string} prompt - The input text prompt for the model to complete.
* @param {string} [modelId] - The ID of the model to use. Defaults to "anthropic.claude-3-haiku-20240307-v1:0".
*/
export const invokeModel = async (
    prompt: string,
    modelId: string = "anthropic.claude-3-haiku-20240307-v1:0",
) => {
    try {
        // Create a new Bedrock Runtime client instance.
        const client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || "us-west-2",
            credentials: fromEnv(),
        });
 
        // Prepare the payload for the model.
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 200000, // Maximum allowed for Claude models
            messages: [
                {
                    role: "user",
                    content: [{ type: "text", text: prompt }],
                },
            ],
        };
 
        // Invoke Claude with the payload and wait for the response.
        const command = new InvokeModelCommand({
            contentType: "application/json",
            body: JSON.stringify(payload),
            modelId,
        });
 
        // Add timeout wrapper to prevent hanging
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Bedrock API timeout after 5 minutes')), 5 * 60 * 1000)
        );
 
        const apiResponse = await Promise.race([
            client.send(command),
            timeout
        ]) as any;
 
        // Decode and return the response(s)
        const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
        const responseBody = JSON.parse(decodedResponseBody);
        // return JSON.parse(responseBody);
        return responseBody.content.map((item: any) => item.text).join('\n');
    } catch (error: any) {
        if (error.name === 'UnrecognizedClientException') {
            throw new Error(`AWS Authentication Error: ${error.message}`);
        }
 
        if (error.name === 'AccessDeniedException') {
            throw new Error(`AWS Bedrock Access Error: ${error.message}`);
        }
 
        throw error;
    }
};