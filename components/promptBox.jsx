'use client'
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { UseAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const PromptBox = ({ setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { user, chats, setChats, selectedChat, setSelectedChat, createNewChat } = UseAppContext();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(e);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendPrompt = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    if (isLoading) {
      toast.error('Please wait for the previous message to finish');
      return;
    }

    if (!prompt.trim() && !selectedImage) {
      toast.error('Please enter a message or select an image');
      return;
    }

    const promptCopy = prompt;
    const imageCopy = imagePreview;

    try {
      setIsLoading(true);
      setPrompt('');
      
      // Auto-create chat if none selected
      let currentChat = selectedChat;
      if (!currentChat?._id) {
        const newChat = await createNewChat();
        if (!newChat) {
          toast.error('Failed to create chat');
          setPrompt(promptCopy);
          return;
        }
        currentChat = newChat;
        setChats([newChat, ...chats]);
        setSelectedChat(newChat);
      }

      // Create user message
      const userMessage = {
        role: 'user',
        content: prompt.trim(),
        image: imagePreview,
        timestamp: Date.now(),
      };

      // Update UI immediately
      const updatedMessages = [...(currentChat.messages || []), userMessage];
      setSelectedChat((prev) => ({
        ...prev,
        messages: updatedMessages,
      }));

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === currentChat._id
            ? { ...chat, messages: updatedMessages }
            : chat
        )
      );

      // Clear image after sending
      removeImage();

      // Send to API
      const { data } = await axios.post(`/api/chat/${currentChat._id}`, {
        message: prompt.trim(),
        image: imagePreview,
      });

      if (data.success) {
        const aiMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
        };

        // Add AI response with typing effect
        const words = data.message.split(' ');
        let displayContent = '';

        for (let i = 0; i < words.length; i++) {
          setTimeout(() => {
            displayContent = words.slice(0, i + 1).join(' ');
            
            setSelectedChat((prev) => {
              const messagesWithoutLast = prev.messages.filter(
                (msg, idx) => idx < prev.messages.length - 1 || msg.role !== 'assistant'
              );
              
              return {
                ...prev,
                messages: [
                  ...messagesWithoutLast,
                  { ...aiMessage, content: displayContent }
                ]
              };
            });

            // Update chat list
            if (i === words.length - 1) {
              setChats((prevChats) =>
                prevChats.map((chat) =>
                  chat._id === currentChat._id
                    ? { 
                        ...chat, 
                        messages: [...updatedMessages, aiMessage],
                        updatedAt: new Date()
                      }
                    : chat
                )
              );
            }
          }, i * 50);
        }
      } else {
        toast.error(data.message || 'Failed to get response');
        setPrompt(promptCopy);
        if (imageCopy) {
          setImagePreview(imageCopy);
        }
      }
    } catch (error) {
      console.error('Send prompt error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please log in to send messages');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to send message. Please try again.');
      }
      
      setPrompt(promptCopy);
      if (imageCopy) {
        setImagePreview(imageCopy);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={sendPrompt}
      className='w-full max-w-3xl'
    >
      {/* Image Preview */}
      {imagePreview && (
        <div className='mb-2 relative inline-block'>
          <img 
            src={imagePreview} 
            alt='Selected' 
            className='max-h-32 rounded-lg border border-gray-600'
          />
          <button
            type='button'
            onClick={removeImage}
            className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
          >
            ×
          </button>
        </div>
      )}

      <div className='bg-[#404045] p-4 rounded-3xl transition-all'>
        <textarea
          onKeyDown={handleKeyDown}
          className="outline-none w-full resize-none overflow-hidden break-words bg-transparent"
          rows={2}
          placeholder="Message DeepChat"
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
          disabled={isLoading}
        />

        <div className="flex items-center justify-between text-sm mt-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              onChange={handleImageSelect}
              className='hidden'
              id='image-upload'
            />
            <label
              htmlFor='image-upload'
              className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'
            >
              <Image 
                style={{ height: 'auto' }} 
                className="h-5" 
                src={assets.pin_icon} 
                alt="Upload Image" 
              />
              Image
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || (!prompt.trim() && !selectedImage)}
              className={`${(prompt.trim() || selectedImage) && !isLoading ? 'bg-primary' : 'bg-[#71717a]'} rounded-full p-2 cursor-pointer disabled:cursor-not-allowed`}
            >
              <Image
                style={{ height: 'auto' }}
                className="w-3.5 aspect-square"
                src={(prompt.trim() || selectedImage) && !isLoading ? assets.arrow_icon : assets.arrow_icon_dull}
                alt="Send"
              />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PromptBox;