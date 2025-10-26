'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import axios from 'axios';

export const AppContext = createContext();

export const UseAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = ({ children }) => {
  const { user } = useUser();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  const createNewChat = async () => {
    try {
      const { data } = await axios.post('/api/chat/create');

      if (data.success && data.data) {
        return data.data;
      } else {
        toast.error(data.message || "Failed to create chat");
        return null;
      }
    } catch (error) {
      console.error('Create chat error:', error);
      toast.error(error?.response?.data?.message || "Failed to create chat");
      return null;
    }
  };

  const fetchUserChats = async () => {
    try {
      const { data } = await axios.get('/api/chat/get');

      let chatList = data?.data || [];

      // Don't auto-create chat - let user start conversation naturally
      // Only set existing chats
      if (chatList.length > 0) {
        chatList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setChats(chatList);
        setSelectedChat(chatList[0]);
      } else {
        setChats([]);
        setSelectedChat(null);
      }
    } catch (error) {
      console.error('Fetch chats error:', error);
      // Don't show error toast for initial load
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserChats();
    }
  }, [user]);

  const value = {
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
