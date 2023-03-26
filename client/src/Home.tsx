import { Alert, Button, CircularProgress, FormControl, Grid, MenuItem, Paper, Select, Snackbar, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { useChatGPTContext } from './Contexts/ChatGPTContext';
import { Model } from './types';

export const Home = () => {
  const { error, loading, message, models, pageCode, url, createApp } = useChatGPTContext();

  const [copied, setCopied] = useState(false);
  const [modelId, setModelId] = useState('gpt-3.5-turbo');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const appPreviewDiv = document.getElementById('app-preview');

    if (appPreviewDiv && pageCode) {
      appPreviewDiv.innerHTML = pageCode;
    }
  }, [pageCode])

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h1 style={{ margin: 0, paddingBottom: 0 }}>
              Welcome to the Single Use App Creator
            </h1>
            Powered by OpenAI
            <h2 style={{ marginTop: '1em' }}>
              Introduction
            </h2>
            <p>
              This site creates single-use apps in about a minute. Type in what you want it to do,
              click the 'Create' button and ChatGPT does the rest. Results are dependent on the prompt,
              just like ChatGPT, and you'll only get what you ask for!
            </p>
            <p>
              At the moment only simple apps can be created as there is a timeout of 60 seconds, so
              don't ask for anything too complicated for now.
            </p>
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12} lg={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h2>How It Works</h2>
            <p>
              By default this site will use the GPT-3.5-Turbo model, but you can choose a different
              one if you like.
            </p>
            {models &&
              <Select
                id={'select-models'}
                value={modelId}
                fullWidth
                onChange={(event: any) => {
                  setModelId(event.target.value);
                }}
              >
                {models.map((model: Model, i: number) =>
                  <MenuItem key={`$menuItem-${model.id}}`} value={model.id}>{model.id} (Created on {new Date(model.created).toUTCString()})</MenuItem>
                )}
              </Select>
            }
            <p style={{ marginTop: '1em' }}>
              Then it's just a case of telling the model what you want.
            </p>
            <FormControl variant='outlined' fullWidth style={{ marginBottom: "1em" }}>
              <TextField
                id={'textField-prompt'}
                value={prompt}
                label='Prompt'
                aria-describedby='Tell the AI what you need'
                onChange={(event: any) => {
                  setPrompt(event.target.value);
                }} />
            </FormControl>
            {error &&
              <Alert severity='error' style={{ margin: '1em 0' }}>{JSON.stringify(error)}</Alert>
            }
            {!message &&
              <Button
                onClick={() => createApp(modelId, prompt)}
                disabled={loading}>
                {loading ? <CircularProgress /> : 'Create'}
              </Button>
            }
            {loading &&
              <Alert severity='info' style={{ marginTop: '1em' }}>
                Your app is being created! It usually takes about 30 seconds...just sit tight.
              </Alert>
            }
            {message && pageCode &&
              <>
                <Alert severity='success'>
                  Your application has been created! The app is previewed below, but if you want
                  to keep it you can copy the code underneath the preview below into a .html file.
                </Alert>
                <div id='app-preview' style={{ border: 'solid grey 1px', borderRadius: '5px', margin: '1em 0', minHeight: '20vh', padding: '1em' }}>
                </div>
                <div style={{ border: 'solid grey 1px', borderRadius: '5px', margin: '0.5em 0', padding: '1em' }}>
                  <Button
                    variant='contained'
                    style={{ float: 'right' }}
                    onClick={() => {
                      setCopied(true);
                      navigator.clipboard.writeText(pageCode);
                    }}>
                    Copy
                  </Button>
                  <Snackbar
                    open={copied}
                    onClose={() => setCopied(false)}
                    autoHideDuration={2000}
                    message="Copied to clipboard"
                  />
                  <code>
                    <p>{pageCode.split(/\n/g).map((line, index) => <>{line}<br key={index} /></>)}</p>
                  </code>
                </div>
              </>
            }
            {
              message && url &&
              <Alert severity='success' style={{ marginTop: '1em' }}>
                Your application has been created! Please click <a href={url} target='_blank' rel='noreferrer'>here</a>
                to go to your app.
              </Alert>
            }
          </Paper>
        </Grid >
      </Grid >
    </>
  );
}
