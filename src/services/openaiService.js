const OpenAI = require('openai');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.assistantId = process.env.OPENAI_ASSISTANT_ID;
  }

  async createThread() {
    try {
      const thread = await this.client.beta.threads.create();
      logger.info('Created new OpenAI thread:', thread.id);
      return thread;
    } catch (error) {
      logger.error('Error creating OpenAI thread:', error);
      throw new Error('Failed to create OpenAI thread');
    }
  }

  async addMessage(threadId, content, role = 'user') {
    try {
      const message = await this.client.beta.threads.messages.create(threadId, {
        role,
        content
      });
      logger.info('Added message to thread:', threadId);
      return message;
    } catch (error) {
      logger.error('Error adding message to thread:', error);
      throw new Error('Failed to add message to thread');
    }
  }

  async runAssistant(threadId) {
    try {
      const run = await this.client.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId
      });
      logger.info('Started assistant run:', run.id);
      return run;
    } catch (error) {
      logger.error('Error running assistant:', error);
      throw new Error('Failed to run assistant');
    }
  }

  async getRunStatus(threadId, runId) {
    try {
      const run = await this.client.beta.threads.runs.retrieve(threadId, runId);
      return run;
    } catch (error) {
      logger.error('Error getting run status:', error);
      throw new Error('Failed to get run status');
    }
  }

  async getMessages(threadId) {
    try {
      const messages = await this.client.beta.threads.messages.list(threadId);
      return messages.data;
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw new Error('Failed to get messages');
    }
  }

  async waitForCompletion(threadId, runId, maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const run = await this.getRunStatus(threadId, runId);
      
      if (run.status === 'completed') {
        return run;
      } else if (run.status === 'failed' || run.status === 'cancelled') {
        throw new Error(`Run ${run.status}: ${run.last_error?.message || 'Unknown error'}`);
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Run timeout - assistant took too long to respond');
  }

  async chatWithAssistant(message, threadId = null) {
    try {
      let currentThreadId = threadId;
      
      // Create new thread if none provided
      if (!currentThreadId) {
        const thread = await this.createThread();
        currentThreadId = thread.id;
      }

      // Add user message
      await this.addMessage(currentThreadId, message);

      // Run assistant
      const run = await this.runAssistant(currentThreadId);

      // Wait for completion
      await this.waitForCompletion(currentThreadId, run.id);

      // Get assistant response
      const messages = await this.getMessages(currentThreadId);
      const assistantMessage = messages.find(msg => msg.role === 'assistant');

      return {
        threadId: currentThreadId,
        response: assistantMessage?.content[0]?.text?.value || 'No response from assistant',
        runId: run.id
      };
    } catch (error) {
      logger.error('Error in chatWithAssistant:', error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();
