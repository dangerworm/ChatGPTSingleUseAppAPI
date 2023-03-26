import { Alert, Backdrop, Button, CircularProgress, FormControl, Grid, MenuItem, Paper, Select, TextField } from '@mui/material';
import { useState } from 'react';
import { useChatGPTContext } from './Contexts/ChatGPTContext';
import { Model } from './types';

export const Home = () => {
  const { error, loading, message, models, url, createApp } = useChatGPTContext();

  const [modelId, setModelId] = useState('gpt-3.5-turbo');
  const [prompt, setPrompt] = useState('');

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
              This site creates single-use apps in about 60 seconds. Type in what you want it to do,
              click the 'Create' button and ChatGPT does the rest. Results are dependent on the prompt,
              just like ChatGPT, and you'll only get what you ask for!
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
              <Alert severity='error' style={{ margin: '1em 0' }}>{error}</Alert>
            }
            <>
              <Button
                onClick={() => createApp(modelId, prompt)}>
                Create
              </Button>
              <Backdrop
                sx={{
                  color: '#fff',
                  zIndex: (theme) => theme.zIndex.drawer + 1
                }}
                open={loading}
              >
                <CircularProgress color="inherit" />
              </Backdrop>
            </>
          </Paper>
        </Grid >
      </Grid >
    </>
  );
}
