import { ThemeProvider } from '@emotion/react';
import { Box, createTheme, CssBaseline } from '@mui/material';
import { ChatGPTContextProvider } from './Contexts/ChatGPTContext';
import { Main } from './Main';

import './App.css';

const mdTheme = createTheme();

const App = () => {
  return (
    <div className="App">
      <ThemeProvider theme={mdTheme}>
        <ChatGPTContextProvider>
          <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <Main />
          </Box>
        </ChatGPTContextProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
