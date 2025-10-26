'use client';
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import Sidebar from '@/components/Sidebar';
import PromptBox from '@/components/promptBox';
import Message from '@/components/Message';
import { UseAppContext } from '@/context/AppContext';

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { selectedChat } = UseAppContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const messages = selectedChat?.messages || [];

  return (
    <div>
      <div className='flex h-screen overflow-hidden'>
        {/* sidebar */}
        <Sidebar expand={expanded} setExpand={setExpanded} />

        <div className='flex-1 flex flex-col bg-[#292a2d] text-white relative'>
          {/* Top mobile menu */}
          <div className='md:hidden absolute px-4 top-6 flex items-center justify-between w-full z-10'>
            <Image
              onClick={() => (expanded ? setExpanded(false) : setExpanded(true))}
              className='rotate-180'
              src={assets.menu_icon}
              alt='Menu icon'
            />
            <Image
              className='opacity-70'
              src={assets.chat_icon}
              alt='Chat icon'
            />
          </div>

          {/* Messages container with scroll */}
          <div className='flex-1 overflow-y-auto px-4 pt-20 md:pt-8 pb-4'>
            {messages.length === 0 ? (
              <div className='flex flex-col items-center justify-center text-center h-full'>
                <div className='flex items-center justify-center gap-3 mb-2'>
                  <Image
                    src={assets.logo_icon}
                    alt='DeepChat Logo'
                    className='h-16'
                    width={64}
                    height={64}
                  />
                  <p className='text-2xl font-medium'>Hi I'm DeepChat.</p>
                </div>
                <p className='text-sm mb-6'>How can I assist you today?</p>
              </div>
            ) : (
              <div className='flex flex-col items-center w-full'>
                {messages.map((msg, index) => (
                  <Message 
                    key={index} 
                    role={msg.role} 
                    content={msg.content}
                    image={msg.image}
                  />
                ))}
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
          <div className='px-4 pb-8 flex flex-col items-center'>
            <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />
            
            {/* Footer note */}
            <p className='text-xs text-gray-500 mt-2'>
              made by
              <a
                href='https://dennis-sabu-portfolio.vercel.app/'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-500 underline ml-1'
              >
                Dennis
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
