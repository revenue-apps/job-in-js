/**
 * OpenAI Utility
 * Centralized OpenAI API calls with consistent configuration and error handling
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  model: 'gpt-4o-mini'
});

/**
 * Make a chat completion request with consistent configuration
 * @param {Array} messages - Array of message objects
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} OpenAI response
 */
export async function chatCompletion(messages, options = {}) {
  try {
    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-4o-mini', // Use mini for cost optimization
      messages,
      max_tokens: options.maxTokens || options.max_tokens || 1000,
      temperature: options.temperature || 0.1,
      response_format: options.responseFormat || options.response_format || { type: 'json_object' }
    });

    return {
      success: true,
      data: response.choices[0].message.content,
      usage: response.usage
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

export default {
  chatCompletion
}; 