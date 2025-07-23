'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { assets } from '@/assets/assets';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <div className='flex h-screen'>
        {/* sidebar */}
        <Sidebar expand={expanded} setExpand={setExpanded} />

        <div className='flex-1 flex flex-col items-center justify-center px-4 pb-8 bg-[#292a2d] text-white relative'>
          <div className='md:hidden absolute px-4 top-6 flex items-center justify-between w-full'>
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

          {messages.length === 0 ? (
            <>
              <div className='h-screen flex flex-col items-center justify-center text-center'>
                <div className='flex items-center justify-center gap-3'>
                  <Image
                    src={assets.logo_icon }
                    alt='No messages'
                    className='h-16'
                    width={64}
                    height={64}
                  />
                  <p className='text-2xl font-medium'>Hi I'm DeepChat.</p>
                </div>
                <p className='text-sm mt-2 items-center'>How can I assist you today?</p>
              </div>
            </>
          ) : (
            <div>
              {/* Render messages here */}
            </div>
          )}

          {/* Footer note */}
          <p className='text-xs text-gray-500 absolute bottom-1 left-1/2 transform -translate-x-1/2'>
            AI-generated, for reference only — made by
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
  );
}
