import axios, { AxiosResponse } from "axios";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CreateAppResponse, Model } from "../types";

export interface IChatGPTContext {
  error: string | undefined;
  loading: boolean;
  message: string | undefined;
  models: Model[];
  url: string | undefined;
  createApp: (modelId: string, prompt: string) => void;
}

export const ChatGPTContext = createContext<IChatGPTContext | undefined>(undefined);

export const ChatGPTContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [models, setModels] = useState<Model[]>([]);
  const [url, setUrl] = useState<string>();

  const baseUrl = process.env.REACT_APP_CHAT_GPT_SINGLE_USE_APP_API_URL;

  const createApp = useCallback((modelId: string, prompt: string) => {
    if (!modelId) {
      setError('Please select a model')
      return;
    }

    if (!prompt) {
      setError('Please write a prompt')
      return;
    }

    setLoading(true);
    axios.post(`${baseUrl}/create-app`, { modelId, prompt })
      .then(({data: { error, message, url}}: AxiosResponse<CreateAppResponse, any>) => {
        setError(error);
        setMessage(message);
        setUrl(url);
        setLoading(false);
      })
      .catch(response => {
        setError(response);
      });
  }, [baseUrl]);

  useEffect(() => {
    async function getModels() {
      await axios.get(`${baseUrl}/get-models`)
      .then(({data}: AxiosResponse<any, any>) => {
        setModels(data as Model[]);
      });
    }
    getModels();
  }, [baseUrl]);

  return (
    <ChatGPTContext.Provider
      value={{
        error,
        loading,
        message,
        models,
        url,
        createApp
      }}
    >
      {children}
    </ChatGPTContext.Provider>
  );
}

export const useChatGPTContext = () => {
  const context = useContext(ChatGPTContext);
  if (context) return context;

  throw Error("Chat GPT context was not registered");
};
