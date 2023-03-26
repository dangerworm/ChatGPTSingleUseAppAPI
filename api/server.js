const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const simpleGit = require('simple-git');
const openaiLibrary = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

const gitToken = process.env.GITHUB_SINGLE_USE_APP_API_PERSONAL_ACCESS_TOKEN || '';
const git = simpleGit();

const openAiKey = process.env.OPENAI_API_KEY || '';

const openAiConfiguration = new openaiLibrary.Configuration({
  apiKey: openAiKey
});
const openai = new openaiLibrary.OpenAIApi(openAiConfiguration);

const isRequestBodyValid = (request, response, requiredBodyKeys) => {
  let errorMessages = [];

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
    return response.data.data;
  }
  catch (error) {
    console.log("Error running getModels", error);
    return [];
  }
}

const createApp = async (model, prompt) => {
  const request = {
    model: model || "gpt-3.5-turbo",
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
  };

  try {
    const response = await openai.createChatCompletion(request);
    return response.data;
  }
  catch (error) {
    console.log("Error running createApp", error.response);
    return error;
  }
}

app
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json())
  .use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.header('Access-Control-Allow-Origin', '*');

    next();
  });

app.options('*', (req, res) => {
  res.sendStatus(200);
});

app.get('/api/get-models', async (request, response) => {
  try {
    const models = await getModels();
    const output = models.map((model) => ({
      id: model.id,
      created: new Date(model.created * 1000).toISOString()
    }));
    output.sort((a, b) => a.created > b.created ? -1 : 1);

    response.type('application/json').send(JSON.stringify(output));
  }
  catch (error) {
    console.log("Error getting models", error);
    response.status(400).send(JSON.stringify(error));
  }
});

app.post('/api/create-app', async (request, response) => {
  const requiredBodyKeys = ['model', 'prompt'];
  if (!isRequestBodyValid(request, response, requiredBodyKeys)) {
    return;
  }

  let conversation;
  let content;
  try {
    conversation = await createApp(request.body['model'], request.body['prompt']);
    if (!conversation) {
      response.status(444).send('Sorry, OpenAI did not return anything');
      return;
    }

    content = conversation.choices[0].message?.content;
    if (!content) {
      response.status(444).send('Sorry, OpenAI did not return anything useful');
      return;
    }
  }
  catch (error) {
    console.log("Error creating app", error);
    response.status(500).send(JSON.stringify(error));
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
          error: null,
          message: conversation.choices[0].message?.content.substring(0, startIndex - 7),
          url: url
        }));
      }
      catch (error) {
        console.log("Error committing to git", error.errorMessage);
        response.status(400).send({
          error: JSON.stringify(error),
          message: "Sorry, something went wrong.",
          url: null
        });
      }
    })
  });
  stream.end();
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`))