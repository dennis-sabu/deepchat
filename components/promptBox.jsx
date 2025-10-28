'use client'
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { assets } from '@/assets/assets';
import { UseAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const PromptBox = ({ setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const { user, chats, setChats, selectedChat, setSelectedChat, createNewChat } = UseAppContext();
  const abortControllerRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.log('Speech recognition not supported');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update prompt with final or interim results
        if (finalTranscript) {
          setPrompt(prev => prev + finalTranscript);
        } else if (interimTranscript) {
          setPrompt(prev => {
            const words = prev.split(' ');
            words[words.length - 1] = interimTranscript;
            return words.join(' ');
          });
        }
      };

      recognition.onerror = (event) => {
        console.log('Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          toast.error('Microphone permission denied');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
        } else if (event.error === 'audio-capture') {
          toast.error('No microphone found');
          setIsListening(false);
        }
        // Ignore network and aborted errors as they're not critical
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        if (isListening) {
          // Restart if still in listening mode
          try {
            recognition.start();
          } catch (err) {
            console.log('Restart failed:', err);
            setIsListening(false);
          }
        }
      };

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (err) {
            console.log('Cleanup error:', err);
          }
        }
      };
    }
  }, [isListening]);

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.log('Stop error:', err);
        setIsListening(false);
      }
    } else {
      // Start listening
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.log('Start error:', err);
        
        // If already started, just toggle the state
        if (err.message && err.message.includes('already started')) {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {
              toast.error('Could not start voice recognition');
            }
          }, 100);
        } else {
          toast.error('Could not start voice recognition');
        }
      }
    }
  };

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

      // Prepare abort controller so user can stop the request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Send to API (attach abort signal)
      const { data } = await axios.post(`/api/chat/${currentChat._id}`, {
        message: prompt.trim(),
        image: imagePreview,
      }, { signal: controller.signal });

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
      // If the request was cancelled by user, show a simple stopped message and don't spam toasts
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        // Show stopped assistant message
        const stoppedMsg = { role: 'assistant', content: 'Stopped by user.', timestamp: Date.now() };
        setSelectedChat((prev) => ({ ...prev, messages: [...(prev.messages || []), stoppedMsg] }));
        setChats((prevChats) => prevChats.map((chat) => chat._id === currentChat._id ? { ...chat, messages: [...(chat.messages || []), stoppedMsg] } : chat));
      } else if (error.response?.status === 401) {
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
      abortControllerRef.current = null;
    }
  };

  const handleStop = async () => {
    // Abort in-flight request and notify server
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Optionally notify server to stop (best-effort, no await to avoid blocking)
      if (selectedChat?._id) {
        axios.post(`/api/chat/${selectedChat._id}`, { stop: true }).catch(() => {});
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Stop error', err);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={sendPrompt}
      className='w-full max-w-3xl'
    >
      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className='mb-3 relative inline-block'
          >
            <img 
              src={imagePreview} 
              alt='Selected' 
              className='max-h-32 rounded-xl border-2 border-blue-500/30 shadow-lg shadow-blue-500/10'
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type='button'
              onClick={removeImage}
              className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition-colors'
            >
              ×
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        animate={{
          boxShadow: isFocused 
            ? '0 0 0 2px rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 255, 255, 0.05)' 
            : '0 0 0 0px rgba(255, 255, 255, 0)'
        }}
        transition={{ duration: 0.2 }}
        className={`bg-transparent p-3 px-4 rounded-[28px] transition-all ${
          isFocused 
            ? 'border border-gray-500/50' 
            : 'border border-gray-700/30'
        }`}
      >
        <div className='flex items-center gap-2'>
          {isListening && (
            <div className='flex items-center gap-1'>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className='w-2 h-2 bg-gray-400 rounded-full'
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className='w-2 h-2 bg-gray-400 rounded-full'
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className='w-2 h-2 bg-gray-400 rounded-full'
              />
            </div>
          )}
          <textarea
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="outline-none w-full resize-none overflow-hidden break-words bg-transparent text-gray-100 placeholder-gray-500"
            rows={1}
            placeholder={isListening ? "Listening..." : "Message DeepChat..."}
            onChange={(e) => setPrompt(e.target.value)}
            onInput={(e) => setPrompt(e.target.value)}
            value={prompt}
            disabled={isLoading}
          />
        </div>

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
            <motion.label
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              htmlFor='image-upload'
              className='flex items-center justify-center w-8 h-8 rounded-full cursor-pointer hover:bg-gray-700/50 transition-all'
              title='Upload image'
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </motion.label>
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleStop}
                className="bg-white hover:bg-gray-200 rounded-full p-2 cursor-pointer transition shadow-lg"
                title="Stop generating"
              >
                <div className="w-3 h-3 bg-black rounded-sm"></div>
              </motion.button>
            ) : (
              <>
                {!prompt.trim() && !selectedImage ? (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={toggleVoiceRecognition}
                    className={`rounded-full p-2 cursor-pointer transition-all ${
                      isListening 
                        ? 'bg-gray-600/50 hover:bg-gray-600/70' 
                        : 'hover:bg-gray-700/50'
                    }`}
                    title={isListening ? 'Stop recording' : 'Voice input'}
                  >
                    <svg className='w-4 h-4 text-gray-400' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={isLoading}
                    className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 rounded-full p-2 cursor-pointer transition-all'
                    title='Send message'
                  >
                    <Image
                      style={{ height: 'auto' }}
                      className="w-4 aspect-square"
                      src={assets.arrow_icon}
                      alt="Send"
                    />
                  </motion.button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.form>
  );
};

export default PromptBox;