'use client'
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { assets } from '@/assets/assets';
import { UseAppContext } from '@/context/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import gsap from 'gsap';
import MagneticWrapper from './MagneticWrapper';

interface PromptBoxProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PromptBox = ({ setIsLoading, isLoading }: PromptBoxProps) => {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const promptBoxRef = useRef<HTMLDivElement>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const stopButtonRef = useRef<HTMLButtonElement>(null);
  const context = UseAppContext() as any;
  const { user, chats, setChats, selectedChat, setSelectedChat, createNewChat } = context;
  const abortControllerRef = useRef<AbortController | null>(null);
  const shouldContinueTypingRef = useRef(true);
  const typingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (promptBoxRef.current) {
      gsap.to(promptBoxRef.current, {
        scale: isFocused ? 1.01 : 1,
        boxShadow: isFocused
          ? '0 10px 40px rgba(59, 130, 246, 0.15)'
          : '0 4px 20px rgba(0, 0, 0, 0.1)',
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }, [isFocused]);

  useEffect(() => {
    const hasText = prompt.trim() || selectedImage;

    if (isLoading) {
      if (stopButtonRef.current) {
        gsap.fromTo(stopButtonRef.current,
          { scale: 0, opacity: 0, rotation: -180 },
          { scale: 1, opacity: 1, rotation: 0, duration: 0.3, ease: 'back.out(1.7)' }
        );
      }
    } else if (hasText) {
      if (sendButtonRef.current) {
        gsap.fromTo(sendButtonRef.current,
          { scale: 0, opacity: 0, x: 20 },
          { scale: 1, opacity: 1, x: 0, duration: 0.3, ease: 'back.out(1.7)' }
        );
      }
    } else {
      if (micButtonRef.current) {
        gsap.fromTo(micButtonRef.current,
          { scale: 0, opacity: 0, rotation: 180 },
          { scale: 1, opacity: 1, rotation: 0, duration: 0.3, ease: 'back.out(1.7)' }
        );
      }
    }
  }, [prompt, selectedImage, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
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

      recognition.onresult = (event: any) => {
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

      recognition.onerror = (event: any) => {
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
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        if (isListening) {
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
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.log('Stop error:', err);
        setIsListening(false);
      }
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.log('Start error:', err);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(e as any);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
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

  const sendPrompt = async (e: React.FormEvent) => {
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
      shouldContinueTypingRef.current = true;

      await new Promise(resolve => setTimeout(resolve, 50));

      setPrompt('');

      let currentChat = selectedChat;
      if (!currentChat?._id) {
        const newChat = await createNewChat();
        if (!newChat) {
          toast.error('Failed to create chat');
          setPrompt(promptCopy);
          return;
        }
        currentChat = newChat;
        setChats((prev: any[]) => [newChat, ...prev]);
        setSelectedChat(newChat);
      }

      const userMessage: any = {
        role: 'user',
        content: prompt.trim(),
        image: imagePreview,
        timestamp: Date.now(),
      };

      const updatedMessages = [...(currentChat.messages || []), userMessage];
      setSelectedChat((prev: any) => ({
        ...prev,
        messages: updatedMessages,
      }));

      setChats((prevChats: any[]) =>
        prevChats.map((chat) =>
          chat._id === currentChat._id
            ? { ...chat, messages: updatedMessages }
            : chat
        )
      );

      removeImage();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const { data } = await axios.post(`/api/chat/${currentChat._id}`, {
        message: prompt.trim(),
        image: imagePreview,
      }, { signal: controller.signal });

      if (data.success) {
        const aiMessage: any = {
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
        };

        const words = data.message.split(' ');
        let displayContent = '';

        for (let i = 0; i < words.length; i++) {
          const timeoutId = setTimeout(() => {
            if (!shouldContinueTypingRef.current) {
              return;
            }

            displayContent = words.slice(0, i + 1).join(' ');

            setSelectedChat((prev: any) => {
              const messagesWithoutLast = prev.messages.filter(
                (msg: any, idx: number) => idx < prev.messages.length - 1 || msg.role !== 'assistant'
              );

              return {
                ...prev,
                messages: [
                  ...messagesWithoutLast,
                  { ...aiMessage, content: displayContent }
                ]
              };
            });

            if (i === words.length - 1) {
              setChats((prevChats: any[]) =>
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
              setIsLoading(false);
              abortControllerRef.current = null;
              typingTimeoutsRef.current = [];
            }
          }, i * 50);

          typingTimeoutsRef.current.push(timeoutId);
        }
      } else {
        toast.error(data.message || 'Failed to get response');
        setPrompt(promptCopy);
        if (imageCopy) {
          setImagePreview(imageCopy);
        }
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    } catch (error: any) {
      console.error('Send prompt error:', error);
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        const stoppedMsg: any = { role: 'assistant', content: 'Stopped by user.', timestamp: Date.now() };
        setSelectedChat((prev: any) => ({ ...prev, messages: [...(prev.messages || []), stoppedMsg] }));
        setChats((prevChats: any[]) => prevChats.map((chat: any) => chat._id === selectedChat?._id ? { ...chat, messages: [...(chat.messages || []), stoppedMsg] } : chat));
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

      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = async () => {
    shouldContinueTypingRef.current = false;

    typingTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    typingTimeoutsRef.current = [];

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

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
      className='w-full max-w-3xl relative z-10 px-4 mb-4'
    >
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className='mb-3 relative inline-block'
          >
            <div className="p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(77,107,254,0.15)] relative">
              <img
                src={imagePreview}
                alt='Selected'
                className='max-h-32 rounded-xl object-contain'
              />
              <MagneticWrapper intensity={0.3} className="absolute -top-3 -right-3 z-20">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type='button'
                  onClick={removeImage}
                  className='bg-red-500/90 backdrop-blur hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg transition-colors border border-red-400/30'
                >
                  ×
                </motion.button>
              </MagneticWrapper>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={promptBoxRef}
        className={`relative p-[1px] rounded-[32px] transition-all duration-300 ${
          isLoading ? 'animate-thinking-glow' : ''
        }`}
      >
        {/* Static Focus Border */}
        {!isLoading && (
          <div className={`absolute inset-0 rounded-[32px] transition-colors duration-300 ${
            (isFocused || prompt || selectedImage) ? 'border border-blue-500/50 shadow-[0_0_15px_rgba(77,107,254,0.15)]' : 'border border-white/10'
          }`} style={{ zIndex: -1 }} />
        )}

        <div className='relative bg-[#050505]/80 backdrop-blur-2xl rounded-[31px] w-full p-2 pl-6 flex items-center gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'>
          {isListening && (
            <div className='flex items-center gap-1.5'>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} className='w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(77,107,254,0.5)]' />
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className='w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(77,107,254,0.5)]' />
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className='w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(77,107,254,0.5)]' />
            </div>
          )}
          <textarea
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 outline-none resize-none overflow-hidden break-words bg-transparent text-gray-100 placeholder-gray-500/70 font-sans text-[15px] max-h-32 leading-relaxed"
            style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
            rows={1}
            placeholder={isListening ? "Listening..." : "Message DeepChat..."}
            onChange={(e) => {
              setPrompt(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
            onInput={(e) => {
              setPrompt((e.target as HTMLTextAreaElement).value);
            }}
            value={prompt}
            disabled={isLoading}
          />

          <div className="flex items-center gap-1.5 pr-2">
            <MagneticWrapper intensity={0.2} radius={30}>
              <div className="relative">
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
                  className='flex items-center justify-center w-10 h-10 rounded-full cursor-pointer hover:bg-white/10 text-gray-400 hover:text-white transition-all'
                  title='Upload image'
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </label>
              </div>
            </MagneticWrapper>

            <MagneticWrapper intensity={0.2} radius={30}>
              <button
                ref={micButtonRef}
                type="button"
                onClick={toggleVoiceRecognition}
                className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all ${
                  isListening
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
                title={isListening ? 'Stop recording' : 'Voice input'}
              >
                <svg className='w-5 h-5' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isListening ? 2.5 : 2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </MagneticWrapper>

            <MagneticWrapper intensity={0.25} radius={40}>
              {isLoading ? (
                <button
                  ref={stopButtonRef}
                  type="button"
                  onClick={handleStop}
                  className="flex items-center justify-center w-10 h-10 bg-white hover:bg-gray-200 rounded-full cursor-pointer transition shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                  title="Stop generating"
                >
                  <div className="w-3.5 h-3.5 bg-black rounded-sm"></div>
                </button>
              ) : (
                <button
                  ref={sendButtonRef}
                  type="submit"
                  disabled={isLoading || (!prompt.trim() && !selectedImage)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all ${
                    (prompt.trim() || selectedImage)
                      ? 'bg-gradient-to-tr from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(77,107,254,0.4)]'
                      : 'bg-white/5 text-gray-500 cursor-not-allowed'
                  }`}
                  title={(prompt.trim() || selectedImage) ? 'Send message' : 'Type a message'}
                >
                  <Image
                    style={{ height: 'auto' }}
                    className={`w-4 aspect-square ${(prompt.trim() || selectedImage) ? '' : 'opacity-50 grayscale'}`}
                    src={assets.arrow_icon}
                    alt="Send"
                  />
                </button>
              )}
            </MagneticWrapper>
          </div>
        </div>
      </div>
    </motion.form>
  );
};

export default PromptBox;
