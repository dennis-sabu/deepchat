'use client'
import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { assets } from '@/assets/assets';
import { useClerk, UserButton } from '@clerk/nextjs';
import { UseAppContext } from '@/context/AppContext';
import ChatLabel from './ChatLabel';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface SidebarProps {
  expand: boolean;
  setExpand: (expand: boolean) => void;
}

const Sidebar = ({ expand, setExpand }: SidebarProps) => {
  const clerk = useClerk();
  const context = UseAppContext() as any;
  const { user, chats, setChats, selectedChat, setSelectedChat, createNewChat } = context;
  const [openMenu, setOpenMenu] = useState({ id: '', open: false });
  const sidebarRef = useRef<HTMLDivElement>(null);

  const openSignIn = clerk?.openSignIn;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expand && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setExpand(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expand, setExpand]);

  return (
    <div
      ref={sidebarRef}
      className={`flex flex-col z-50 max-md:absolute max-md:h-screen transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
        expand ? 'w-[280px]' : 'md:w-[68px] w-0 max-md:-translate-x-full'
      } ${!expand && 'max-md:overflow-hidden'}`}
    >
      {/* Floating Island Container */}
      <div className='flex flex-col flex-1 m-2 mr-0 bg-surface-1/80 backdrop-blur-2xl rounded-2xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden'>
        {/* Top Section */}
        <div className='flex-1 overflow-y-auto pt-3'>
          <div className='flex items-center justify-between px-3 mb-3'>
            <AnimatePresence>
              {expand && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className='flex items-center gap-2'
                >
                  <span className='text-white font-semibold text-lg tracking-tight' style={{ fontFamily: 'var(--font-geist-sans), var(--font-heading)' }}>
                    DeepChat
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpand(!expand)}
              className='flex items-center justify-center hover:bg-white/[0.06] transition-all duration-200 h-9 w-9 rounded-xl cursor-pointer'
            >
              <Image
                src={assets.menu_icon}
                alt='Menu'
                className='w-5 h-5 md:hidden'
              />
              <Image
                src={expand ? assets.sidebar_close_icon : assets.sidebar_icon}
                alt='Toggle'
                className='w-5 h-5 hidden md:block'
              />
            </motion.button>
          </div>

          {/* New Chat Button */}
          <div className='px-2 mb-3'>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                const newChat = await createNewChat();
                if (newChat) {
                  setChats((prev: any[]) => [newChat, ...prev]);
                  setSelectedChat(newChat);
                  toast.success('New chat created');
                }
              }}
              className={`flex items-center cursor-pointer transition-all w-full ${
                expand
                  ? 'gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]'
                  : 'h-10 w-10 mx-auto rounded-xl hover:bg-white/[0.06] justify-center'
              }`}
              title={!expand ? 'New chat' : ''}
            >
              <svg className='w-4.5 h-4.5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 4v16m8-8H4' />
              </svg>
              <AnimatePresence>
                {expand && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='text-gray-300 text-sm font-medium tracking-tight'
                  >
                    New chat
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Chat List */}
          <AnimatePresence>
            {expand && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className='px-2'
              >
                <p className='text-[11px] uppercase tracking-wider text-gray-500 px-2 mb-2 font-medium'>Recents</p>
                <ChatLabel openMenu={openMenu} setOpenMenu={setOpenMenu} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Section */}
        <div className='border-t border-white/[0.04] p-2'>
          <motion.div
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            onClick={!user && openSignIn ? () => openSignIn() : undefined}
            className={`flex items-center cursor-pointer transition-all rounded-xl ${
              expand ? 'gap-3 p-2.5' : 'justify-center p-2.5'
            }`}
          >
            {user ? (
              <>
                <div className='flex items-center gap-3 w-full'>
                  <UserButton />
                  <AnimatePresence>
                    {expand && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='text-gray-300 text-sm truncate'
                      >
                        My profile
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Image src={assets.profile_icon} alt='Profile' className='w-6 h-6' />
                <AnimatePresence>
                  {expand && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className='text-gray-300 text-sm'
                    >
                      Sign in
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
