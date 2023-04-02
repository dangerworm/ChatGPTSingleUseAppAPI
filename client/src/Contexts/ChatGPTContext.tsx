import { io } from "socket.io-client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { APP_CREATED, CREATE_APP, ERROR, GET_MODELS, MODELS_RETURNED } from "../constants";
import { Model } from "../types";
import { v4 as uuidv4 } from "uuid";

export interface IChatGPTContext {
  error: string | undefined;
  loading: boolean;
  message: string | undefined;
  models: Model[];
  pageCode: string | undefined;
  createApp: (modelId: string, prompt: string) => void;
}

export const ChatGPTContext = createContext<IChatGPTContext | undefined>(undefined);

export const ChatGPTContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [models, setModels] = useState<Model[]>([]);
  const [pageCode, setPageCode] = useState<string | undefined>();

  const baseUrl = 'https://chat-gpt-single-use-app-api.herokuapp.com';
  const socket = io(baseUrl);

  useEffect(() => {
    socket.on(MODELS_RETURNED, (requestId, httpStatusCode, data) => {
      const output = data.map((datum: any) => ({
        id: datum.id,
        created: new Date(datum.created * 1000).toISOString()
      }));
      output.sort((a: Model, b: Model) => a.created > b.created ? -1 : 1);

      setModels(output);
    });

    socket.on(APP_CREATED, (requestId, httpStatusCode, content) => {
      // ChatGPT insists on saying something around the code, so strip it off
      const startIndex = content.indexOf('<!DOCTYPE html>');
      const stopIndex = content.indexOf('</html>') + 7;
      const pageCode = content.substring(startIndex, stopIndex);

      setError(undefined);
      setMessage(content.substring(0, startIndex - 7));
      setPageCode(pageCode);
      setLoading(false);
    });

    socket.on(ERROR, (requestId, httpStatusCode, data) => {
      setError(data);
      setMessage(undefined);
      setPageCode(undefined);
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    }
  }, [socket]);

  useEffect(() => {
    if (!models || models.length === 0) {
      socket.emit(GET_MODELS, { requestId: uuidv4() });
    }
  }, [socket, models]);

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
    socket.emit(CREATE_APP, { model: modelId, prompt });
  }, [socket]);

  return (
    <ChatGPTContext.Provider
      value={{
        error,
        loading,
        message,
        models,
        pageCode,
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
