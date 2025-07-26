'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import axios from 'axios';

export const AppContext = createContext();

export const UseAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = ({ children }) => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState({ messages: [] }); // set a safe default

  const createNewChat = async () => {
    try {
      const token = await getToken();
      if (!token) return toast.error("No token found");

      const { data } = await axios.post(
        '/api/chat/create',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success && data.data) {
        return data.data;
      } else {
        toast.error(data.message || "Failed to create chat");
        return null;
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      return null;
    }
  };

  const fetchUserChats = async () => {
    try {
      const token = await getToken();
      if (!token) return toast.error("No token found");

      const { data } = await axios.get('/api/chat/get', {
        headers: { Authorization: `Bearer ${token}` },
      });

      let chatList = data?.data || [];

      if (chatList.length === 0) {
        const newChat = await createNewChat();
        if (newChat) chatList = [newChat];
      }

      chatList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setChats(chatList);
      setSelectedChat(chatList[0] || { messages: [] }); // ensure messages is always defined
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
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
