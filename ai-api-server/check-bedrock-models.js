// Check available Bedrock models in your AWS account
import { config } from 'dotenv';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { fromEnv } from '@aws-sdk/credential-providers';

// Load environment variables
config();

async function checkAvailableModels() {
  try {
    console.log('🔍 Checking available Bedrock models...');
    console.log('📍 Region:', process.env.AWS_REGION || 'us-west-2');
    
    const client = new BedrockClient({
      region: process.env.AWS_REGION || 'us-west-2',
      credentials: fromEnv(),
    });

    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);
    
    console.log('\n✅ Available Models:');
    console.log('==================');
    
    const claudeModels = response.modelSummaries.filter(model => 
      model.modelId.includes('claude')
    );
    
    if (claudeModels.length > 0) {
      console.log('\n🤖 Claude Models Available:');
      claudeModels.forEach(model => {
        console.log(`✅ ${model.modelName} (${model.modelId})`);
      });
      
      // Check if Claude 3.5 Haiku model is available
      const claude35HaikuAvailable = claudeModels.find(model => 
        model.modelId === 'anthropic.claude-3-5-haiku-20241022-v1:0'
      );
      
      if (claude35HaikuAvailable) {
        console.log('\n🎉 Your target model is available!');
        console.log(`✅ ${claude35HaikuAvailable.modelName} (${claude35HaikuAvailable.modelId})`);
      } else {
        console.log('\n❌ Target model NOT found: anthropic.claude-3-5-haiku-20241022-v1:0');
        console.log('\n💡 Available Claude models:');
        claudeModels.slice(0, 5).forEach(model => {
          console.log(`   • ${model.modelName} (${model.modelId})`);
        });
      }
    } else {
      console.log('❌ No Claude models available');
      console.log('\n📋 All available models:');
      response.modelSummaries.slice(0, 10).forEach(model => {
        console.log(`   ${model.modelName} (${model.modelId})`);
      });
    }
    
    console.log('\n💡 If your target Claude 3.5 Haiku model is missing:');
    console.log('   1. Go to AWS Bedrock Console → Model access');
    console.log('   2. Request access to: anthropic.claude-3-5-haiku-20241022-v1:0');
    console.log('   3. Wait for approval (usually instant for Claude models)');
    
  } catch (error) {
    console.error('❌ Error checking models:', error.message);
    
    if (error.name === 'UnrecognizedClientException') {
      console.log('\n🔧 Fix: Check AWS credentials in .env file');
      console.log('   AWS_ACCESS_KEY_ID=your_key_here');
      console.log('   AWS_SECRET_ACCESS_KEY=your_secret_here');
    } else if (error.name === 'AccessDeniedException') {
      console.log('\n🔧 Fix: Enable Bedrock permissions in AWS IAM');
      console.log('   Required permission: bedrock:ListFoundationModels');
    }
  }
}

checkAvailableModels();
