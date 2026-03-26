'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import axios from 'axios';

interface IChat {
  _id: string;
  name: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    image?: string;
    timestamp: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

interface IUser {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  emailAddresses?: Array<{
    emailAddress: string;
  }>;
}

interface AppContextType {
  user: IUser | null | undefined;
  chats: IChat[];
  setChats: React.Dispatch<React.SetStateAction<IChat[]>>;
  selectedChat: IChat | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<IChat | null>>;
  createNewChat: () => Promise<IChat | null>;
  fetchUserChats: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const UseAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('UseAppContext must be used within AppContextProvider');
  }
  return context;
};

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();

  const [chats, setChats] = useState<IChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<IChat | null>(null);

  const createNewChat = async (): Promise<IChat | null> => {
    try {
      const { data } = await axios.post('/api/chat/create');

      if (data.success && data.data) {
        return data.data;
      } else {
        toast.error(data.message || "Failed to create chat");
        return null;
      }
    } catch (error: any) {
      console.error('Create chat error:', error);
      toast.error(error?.response?.data?.message || "Failed to create chat");
      return null;
    }
  };

  const fetchUserChats = async (): Promise<void> => {
    try {
      const { data } = await axios.get('/api/chat/get');

      let chatList: IChat[] = data?.data || [];

      if (chatList.length > 0) {
        chatList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setChats(chatList);
        setSelectedChat(chatList[0]);
      } else {
        setChats([]);
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Fetch chats error:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserChats();
    }
  }, [user]);

  const value: AppContextType = {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    createNewChat,
    fetchUserChats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
