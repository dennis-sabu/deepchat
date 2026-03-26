'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { assets } from '@/assets/assets';
import Sidebar from '@/components/Sidebar';
import PromptBox from '@/components/promptBox';
import Message from '@/components/Message';
import { UseAppContext } from '@/context/AppContext';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp?: number;
}

interface IChat {
  _id?: string;
  name?: string;
  messages: IMessage[];
  createdAt?: string;
  updatedAt?: string;
}

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const { user, selectedChat, sendMessage, createNewChat, setChats, chats, setSelectedChat } = UseAppContext() as any;

  useEffect(() => {
    const initializeChat = async () => {
      if (user && !selectedChat) {
        const newChat = await createNewChat();
        if (newChat) {
          setChats((prev: IChat[]) => [newChat, ...prev]);
          setSelectedChat(newChat);
        }
      }
    };
    initializeChat();
  }, [user]);

  const scrollToBottom = () => {
    if (!userHasScrolled && messagesContainerRef.current) {
      gsap.to(messagesContainerRef.current, {
        scrollTo: { y: 'max', autoKill: true },
        duration: 0.6,
        ease: 'power2.out'
      });
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setUserHasScrolled(!isAtBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages, userHasScrolled]);

  useEffect(() => {
    if (isLoading) setUserHasScrolled(false);
  }, [isLoading]);

  const messages = selectedChat?.messages || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const suggestions = [
    { text: 'Explain quantum computing simply', icon: '🧠', accent: 'from-blue-500/15 to-indigo-500/10 border-blue-500/10 hover:border-blue-500/25' },
    { text: 'Help me write clean code', icon: '⚡', accent: 'from-violet-500/15 to-purple-500/10 border-violet-500/10 hover:border-violet-500/25' },
    { text: 'Create a story for me', icon: '✨', accent: 'from-amber-500/15 to-orange-500/10 border-amber-500/10 hover:border-amber-500/25' },
    { text: 'Solve a tricky problem', icon: '🎯', accent: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/10 hover:border-emerald-500/25' },
  ];

  return (
    <div className='bg-obsidian min-h-screen'>
      <div className='flex h-screen overflow-hidden relative'>
        {/* Mesh Gradient Ambient Orbs */}
        <div className='fixed inset-0 pointer-events-none overflow-hidden' style={{ zIndex: 0 }}>
          <div className='absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px] animate-float-1' />
          <div className='absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet/[0.04] blur-[120px] animate-float-2' />
        </div>

        <Sidebar expand={expanded} setExpand={setExpanded} />

        <div className='flex-1 flex flex-col text-white relative' style={{ zIndex: 1 }}>
          {/* Top Header — Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className='sticky top-0 z-20'
          >
            <div className='bg-obsidian/60 backdrop-blur-2xl border-b border-white/[0.04]'>
              <div className='flex items-center justify-between px-5 md:px-6 py-3.5'>
                <div className='flex items-center gap-3'>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className='md:hidden'
                  >
                    <Image
                      onClick={() => setExpanded(!expanded)}
                      className='rotate-180 cursor-pointer w-5 h-5 opacity-60 hover:opacity-100 transition-opacity'
                      src={assets.menu_icon}
                      alt='Menu icon'
                    />
                  </motion.div>

                  <h1
                    className='text-lg font-semibold text-white/90 tracking-tight'
                    style={{ fontFamily: 'var(--font-geist-sans), var(--font-heading)' }}
                  >
                    DeepChat
                  </h1>
                </div>

                <div className='flex items-center gap-1'>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href='https://github.com/dennis-sabu'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-gray-500 hover:text-white transition-all p-2.5 rounded-xl hover:bg-white/[0.04]'
                    title='GitHub'
                  >
                    <svg className='w-[18px] h-[18px]' fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/>
                    </svg>
                  </motion.a>

                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href='https://instagram.com/dennis_sabu'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-gray-500 hover:text-white transition-all p-2.5 rounded-xl hover:bg-white/[0.04]'
                    title='Instagram'
                  >
                    <svg className='w-[18px] h-[18px]' fill='currentColor' viewBox='0 0 24 24'>
                      <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/>
                    </svg>
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className='flex-1 overflow-y-auto px-4 pt-6 md:pt-8 pb-4'
          >
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className='flex flex-col items-center justify-center text-center h-full'
              >
                {/* Greeting */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className='mb-10'
                >
                  <h1
                    className='text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent'
                    style={{ fontFamily: 'var(--font-geist-sans), var(--font-heading)', letterSpacing: '-0.04em' }}
                  >
                    {getGreeting()}, {user?.firstName || 'there'}
                  </h1>
                  <p className='text-lg text-gray-500 font-light tracking-tight'>
                    What would you like to explore today?
                  </p>
                </motion.div>

                {/* Suggestion Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className='grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl w-full px-4'
                >
                  {suggestions.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.08, duration: 0.4 }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          textarea.value = item.text;
                          textarea.dispatchEvent(new Event('input', { bubbles: true }));
                          setTimeout(() => {
                            const form = textarea.closest('form');
                            if (form) form.requestSubmit();
                          }, 50);
                        }
                      }}
                      className={`bg-gradient-to-br ${item.accent} border rounded-2xl p-4 cursor-pointer backdrop-blur-md transition-all duration-300 group`}
                    >
                      <div className='flex items-center gap-3'>
                        <span className='text-xl group-hover:scale-110 transition-transform duration-300'>{item.icon}</span>
                        <p className='text-sm text-gray-300 group-hover:text-white transition-colors text-left'>{item.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <div className='flex flex-col items-center w-full'>
                <AnimatePresence>
                  {messages.map((msg: IMessage, index: number) => (
                    <Message
                      key={index}
                      role={msg.role}
                      content={msg.content}
                      image={msg.image}
                    />
                  ))}
                  {isLoading && !selectedChat?.messages?.some((msg: IMessage) => msg.role === 'assistant' && msg.content && msg.content !== 'Thinking...') && (
                    <Message
                      key="thinking-msg-skeleton"
                      role='assistant'
                      content='Thinking...'
                      isLoading={true}
                    />
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Prompt Box Area */}
          <div className='px-4 pb-6 flex flex-col items-center pt-2'>
            <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className='text-[11px] text-gray-600 mt-3 tracking-wide'
            >
              Built by{' '}
              <a
                href='https://dennissabu.pages.dev'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-500 hover:text-primary underline decoration-gray-700 hover:decoration-primary/50 transition-all'
              >
                Dennis Sabu
              </a>
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
