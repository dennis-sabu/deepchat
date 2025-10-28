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

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const { user, selectedChat, sendMessage } = UseAppContext();

  const scrollToBottom = () => {
    if (!userHasScrolled && messagesContainerRef.current) {
      gsap.to(messagesContainerRef.current, {
        scrollTo: { y: 'max', autoKill: true },
        duration: 0.6,
        ease: 'power2.out'
      });
    }
  };

  // Detect user scroll
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // If user scrolls up, set flag to true
      if (!isAtBottom) {
        setUserHasScrolled(true);
      } else {
        // If user scrolls back to bottom, reset flag
        setUserHasScrolled(false);
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages, userHasScrolled]);

  // Reset scroll flag when loading starts
  useEffect(() => {
    if (isLoading) {
      setUserHasScrolled(false);
    }
  }, [isLoading]);

  const messages = selectedChat?.messages || [];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className='bg-[#0f0f0f]'>
      <div className='flex h-screen overflow-hidden'>
        {/* sidebar */}
        <Sidebar expand={expanded} setExpand={setExpanded} />

        <div className='flex-1 flex flex-col bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a] text-white relative'>
          {/* Top bar - Social Links */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='sticky top-0 z-20 bg-[#171717]/80 backdrop-blur-xl border-b border-gray-800/50'
          >
            <div className='flex items-center justify-between px-4 md:px-6 py-3'>
              {/* Left side - DeepChat name and Mobile menu */}
              <div className='flex items-center gap-3'>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className='md:hidden'
                >
                  <Image
                    onClick={() => (expanded ? setExpanded(false) : setExpanded(true))}
                    className='rotate-180 cursor-pointer w-6 h-6'
                    src={assets.menu_icon}
                    alt='Menu icon'
                  />
                </motion.div>
                
                {/* DeepChat Name - visible on all screens */}
                <h1 className='text-xl font-semibold text-white tracking-tight'>
                  DeepChat
                </h1>
              </div>

              {/* Right side - Social links */}
              <div className='flex items-center gap-4'>
                {/* GitHub */}
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  href='https://github.com/dennis-sabu'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-gray-400 hover:text-white transition-all p-2 rounded-lg hover:shadow-[0_0_20px_rgba(96,165,250,0.4)] hover:bg-blue-500/10'
                  title='GitHub'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/>
                  </svg>
                </motion.a>

                {/* Instagram */}
                <motion.a
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  href='https://instagram.com/dennis_sabu'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-gray-400 hover:text-white transition-all p-2 rounded-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:bg-pink-500/10'
                  title='Instagram'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                    <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/>
                  </svg>
                </motion.a>
              </div>
            </div>
          </motion.div>

          {/* Messages container with scroll */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className='flex-1 overflow-y-auto px-4 pt-6 md:pt-8 pb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent'
          >
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className='flex flex-col items-center justify-center text-center h-full'
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className='mb-4'
                >
                  <h1 className='text-4xl md:text-5xl font-semibold text-white tracking-tight mb-2'>
                    {getGreeting()}, {user?.firstName || 'there'}!
                  </h1>
                  <p className='text-xl md:text-2xl text-gray-400 font-light'>
                    What's on your mind?
                  </p>
                </motion.div>
                
                {/* Suggestion cards */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className='grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full px-4'
                >
                  {[
                    { text: 'Explain a complex concept', color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20', glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]' },
                    { text: 'Help me write code', color: 'from-purple-500/10 to-purple-600/10 border-purple-500/20', glow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]' },
                    { text: 'Create content for me', color: 'from-pink-500/10 to-pink-600/10 border-pink-500/20', glow: 'hover:shadow-[0_0_25px_rgba(236,72,153,0.4)]' },
                    { text: 'Solve a problem', color: 'from-green-500/10 to-green-600/10 border-green-500/20', glow: 'hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          textarea.value = item.text;
                          textarea.dispatchEvent(new Event('input', { bubbles: true }));
                          // Auto-submit
                          const form = textarea.closest('form');
                          if (form) {
                            form.requestSubmit();
                          }
                        }
                      }}
                      className={`bg-gradient-to-br ${item.color} ${item.glow} border rounded-3xl p-4 cursor-pointer backdrop-blur-md transition-all shadow-sm hover:border-opacity-50`}
                    >
                      <p className='text-sm text-gray-300'>{item.text}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              <div className='flex flex-col items-center w-full'>
                <AnimatePresence mode='popLayout'>
                  {messages.map((msg, index) => (
                    <Message 
                      key={index} 
                      role={msg.role} 
                      content={msg.content}
                      image={msg.image}
                    />
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <Message 
                    role='assistant' 
                    content='Thinking...'
                    isLoading={true}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Prompt box at bottom */}
          <div className='px-4 pb-8 flex flex-col items-center pt-4'>
            <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />
            
            {/* Footer note */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className='text-xs text-gray-500 mt-3'
            >
              Built with ❤️ by
              <a
                href='https://dennis-sabu-portfolio.vercel.app/'
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-400 hover:text-blue-300 underline ml-1 transition-colors'
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
