const openaiLibrary = require('openai');

const { MODELS_RETURNED, APP_CREATED, ERROR } = require('./constants');

const openAiKey = process.env.OPENAI_API_KEY || '';

const openAiConfiguration = new openaiLibrary.Configuration({
  apiKey: openAiKey,
  timeout: 120000
});
const openai = new openaiLibrary.OpenAIApi(openAiConfiguration);

class Hub {
  constructor(io) {
    this.io = io;
  }

  send = (action, { requestId, httpStatusCode, data }) => {
    this.io.emit(action, requestId, httpStatusCode, data);
  }

  onReceive = (action, callback) => {
    this.io.on(action, callback);
  }

  error = async ({ requestId, httpStatusCode, error }) => {
    this.send(ERROR, { requestId, httpStatusCode, error });
  }

  handleRequest = (action, callback) => {
    return new Promise((resolve, reject) => {
      this.onReceive(action, (data) => {
        if (callback(data)) {
          resolve(data);
        }
        else {
          reject(new Error('Request could not be completed'));
        }
      });
    });
  }

  getModels = async (requestId) => {
    try {
      const response = await openai.listModels();
      this.send(MODELS_RETURNED, { requestId, httpStatusCode: 200, data: response.data.data });
    }
    catch (error) {
      this.error(ERROR, { requestId, httpStatusCode: error.response.httpStatusCode, error: error.response });
    }
  }

  createApp = async (requestId, model, prompt) => {
    let conversation;

    try {
      conversation = await this.tryCreateApp(model, prompt);
    }
    catch (error) {
      this.error({ requestId, httpStatusCode: 500, error: JSON.stringify(error) });
      return;
    }

    if (!conversation) {
      this.error({ requestId, httpStatusCode: 444, error: 'Sorry, OpenAI did not return anything' });
      return;
    }

    const content = conversation.choices[0].message?.content;
    if (!content) {
      this.error({ requestId, httpStatusCode: 444, error: 'Sorry, OpenAI did not return anything useful' });
      return;
    }

    this.send(APP_CREATED, { requestId, httpStatusCode: 200, data: content });
  }

  tryCreateApp = async (model, prompt) => {
    const request = {
      model: model || "gpt-3.5-turbo",
      messages: [
        {
          role: "system", content: "You are a helpful assistant for creating single-page applications. " +
            "Every time you receive a prompt you return a single page of HTML, CSS, and Javascript which, " +
            "when put into a '.html' file, acts to solve the user's problem or problems. " +
            "Import jQuery regardless of whether it is used, and use Bootstrap for styling. " +
            "Make applications as user-friendly as possible."
        },
        { role: "user", content: prompt }
      ]
    };

    try {
      const response = await openai.createChatCompletion(request);
      return response.data;
    }
    catch (error) {
      throw error;
    }
  }
}

module.exports = Hub;