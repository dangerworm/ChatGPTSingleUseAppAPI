import bodyParser from 'body-parser';
import express from 'express';
import fs from 'fs';
import simpleGit from 'simple-git';
import { OpenAIApi, Configuration, Model, CreateChatCompletionRequest, CreateChatCompletionResponse } from 'openai';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

const gitToken = process.env.GITHUB_SINGLE_USE_APP_API_PERSONAL_ACCESS_TOKEN || '';
const git = simpleGit();

const openAiKey = process.env.OPENAI_API_KEY || '';

const openAiConfiguration = new Configuration({
  apiKey: openAiKey
});
const openai = new OpenAIApi(openAiConfiguration);

const isRequestBodyValid = (request: any, response: any, requiredBodyKeys: string[]) => {
  let errorMessages: string[] = [];

  for (let i in requiredBodyKeys) {
    if (!request.body || !request.body[requiredBodyKeys[i]]) {
      const errorMessage = `Request body did not contain key '${requiredBodyKeys[i]}'`;
      errorMessages.push(errorMessage)
      break;
    }
  }

  if (errorMessages.length > 0) {
    console.log("Errors with request", errorMessages.join('; '));
    response.status(400).send(errorMessages.join('; '));
    return false;
  }

  return true;
}

const getModels = async () => {
  try {
    const response = await openai.listModels();
    return response.data.data as Model[];
  }
  catch (error: any) {
    console.log("Error running getModels", error.response);
    return error.errorMessage;
  }
}

const createApp = async (prompt: string): Promise<CreateChatCompletionResponse> => {
  const request = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system", content: "You are a helpful assistant for creating single-page applications. " +
          "Every time you receive a prompt you will return a single page of HTML, CSS, and Javascript which, " +
          "when put into a '.html' file, will act to solve the user's problem or problems. " +
          "Import jQuery regardless of whether it is used, and use Bootstrap for styling. " +
          "Make it as user-friendly as possible."
      },
      { role: "user", content: prompt }
    ]
  } as CreateChatCompletionRequest;

  try {
    const response = await openai.createChatCompletion(request);
    return response.data;
  }
  catch (error: any) {
    console.log("Error running createApp", error.response);
    return error.errorMessage;
  }
}

app
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json());

app.get('/api/get-models', async (request, response) => {
  const models = await getModels();

  const output = models.map((model: Model) => ({
    id: model.id,
    created: new Date(model.created * 1000).toISOString()
  }));
  output.sort((a: any, b: any) => a.created > b.created ? -1 : 1);

  response.type('application/json').send(JSON.stringify(output));
});

app.post('/api/create-app', async (request, response) => {
  const requiredBodyKeys = ['prompt'];
  if (!isRequestBodyValid(request, response, requiredBodyKeys)) {
    return;
  }

  const conversation = await createApp(request.body['prompt']);
  const content = conversation.choices[0].message?.content;
  if (!content) {
    response.send('Sorry, OpenAI did not return anything useful');
    return;
  }

  // ChatGPT insists on saying something around the code, so strip it off
  const startIndex = content.indexOf('<!DOCTYPE html>');
  const stopIndex = content.indexOf('</html>') + 7;
  const html = content.substring(startIndex, stopIndex);

  // Write file to new app folder
  const directory = `./apps/${conversation.id}`;
  fs.mkdir(directory, () => {
    // console.log(`Directory '${directory}' created successfully`)
  });
  const stream = fs.createWriteStream(`${directory}/index.html`);
  stream.write(html, () => {
    // console.log(`File 'apps/${conversation.id}/index.html' created successfully`);

    stream.on('finish', async () => {
      // Push to git
      try {
        await git.add('.');
        await git.commit(`Created app '${conversation.id}'`);
        await git.push('origin', 'main');
        // console.log('Committed and pushed new file');

        const url = `https://htmlpreview.github.io/?https://github.com/dangerworm/ChatGPTSingleUseAppAPI/blob/main/apps/${conversation.id}/index.html`;
        response.type('application/json').send(JSON.stringify({
          message: conversation.choices[0].message?.content.substring(0, startIndex - 9),
          url: url
        }));
      }
      catch (error: any) {
        console.log("Error committing to git", error.errorMessage);
        response.status(400).send(JSON.stringify(error));
      }
    })
  });
  stream.end();
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`))