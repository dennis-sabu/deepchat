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
import gsap from 'gsap';

const Sidebar = ({ expand, setExpand }) => {
  const clerk = useClerk();
  const { user, chats, setChats, selectedChat, setSelectedChat, createNewChat } = UseAppContext();
  const [openMenu, setOpenMenu] = useState({id: 0, open: false});
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const recentsRef = useRef(null);
  const profileTextRef = useRef(null);

  const openSignIn = clerk?.openSignIn;

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close on mobile or when expanded on desktop
      if (expand && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setExpand(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expand, setExpand]);

  useEffect(() => {
    const tl = gsap.timeline();

    if (expand) {
      // Opening animation
      if (sidebarRef.current) {
        tl.to(sidebarRef.current, {
          width: 256,
          duration: 0.4,
          ease: 'power2.inOut'
        });
      }

      // Animate content elements that exist
      const elementsToAnimate = [contentRef.current, recentsRef.current, profileTextRef.current].filter(el => el !== null);
      if (elementsToAnimate.length > 0) {
        tl.to(elementsToAnimate, {
          opacity: 1,
          x: 0,
          duration: 0.3,
          ease: 'power2.out',
          stagger: 0.05
        }, '-=0.2');
      }
    } else {
      // Closing animation - hide content first, then shrink
      const elementsToAnimate = [contentRef.current, recentsRef.current, profileTextRef.current].filter(el => el !== null);
      if (elementsToAnimate.length > 0) {
        tl.to(elementsToAnimate, {
          opacity: 0,
          x: -10,
          duration: 0.2,
          ease: 'power2.in',
          stagger: 0.03
        });
      }

      if (sidebarRef.current) {
        tl.to(sidebarRef.current, {
          width: 60,
          duration: 0.4,
          ease: 'power2.inOut'
        }, '-=0.1');
      }
    }

    return () => tl.kill();
  }, [expand]);

  return (
    <div 
      ref={sidebarRef}
      className={`flex flex-col bg-[#171717] pt-3 z-50 max-md:absolute max-md:h-screen border-r border-gray-800/50 ${expand ? 'w-64' : 'md:w-[60px] w-0 max-md:-translate-x-full'} ${!expand && 'max-md:overflow-hidden'}`}
    >
      {/* Top Section */}
      <div className='flex-1 overflow-y-auto'>
        {/* Header with Logo/Name and Toggle */}
        <div className='flex items-center justify-between px-3 mb-3'>
          {expand && (
            <div
              ref={contentRef}
              className='flex items-center gap-2 md:hidden'
            >
              <span className='text-white font-semibold text-lg'>DeepChat</span>
            </div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setExpand(!expand)}
            className='flex items-center justify-center hover:bg-gray-700/50 transition-all duration-200 h-9 w-9 rounded-lg cursor-pointer'
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
        <div className='px-2 mb-2'>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              const newChat = await createNewChat();
              if (newChat) {
                setChats([newChat, ...chats]);
                setSelectedChat(newChat);
                toast.success('New chat created');
              }
            }}
            className={`flex items-center justify-center cursor-pointer transition-all w-full ${
              expand 
                ? 'gap-2 p-2.5 rounded-lg hover:bg-gray-700/50' 
                : 'h-10 w-10 mx-auto rounded-lg hover:bg-gray-700/50'
            }`}
            title={!expand ? 'New chat' : ''}
          >
            <svg className='w-5 h-5 text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            {expand && <span className='text-gray-200 text-sm font-medium'>New chat</span>}
          </motion.button>
        </div>

        {/* Recents */}
        {expand && (
          <div 
            ref={recentsRef}
            style={{ opacity: 0 }}
            className='px-2'
          >
            <ChatLabel openMenu={openMenu} setOpenMenu={setOpenMenu} />
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className='border-t border-gray-800/50 p-2'>
        {/* User Profile */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={!user && openSignIn ? openSignIn : undefined}
          className={`flex items-center cursor-pointer transition-all rounded-lg hover:bg-gray-700/50 ${
            expand ? 'gap-3 p-2' : 'justify-center p-2'
          }`}
        >
          {user ? (
            <>
              <div className='flex items-center gap-3 w-full'>
                <UserButton />
                {expand && (
                  <span 
                    ref={profileTextRef}
                    style={{ opacity: 0 }}
                    className='text-gray-200 text-sm truncate'
                  >
                    My profile
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <Image src={assets.profile_icon} alt='Profile' className='w-6 h-6' />
              {expand && (
                <span 
                  ref={profileTextRef}
                  style={{ opacity: 0 }}
                  className='text-gray-200 text-sm'
                >
                  Sign in
                </span>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Sidebar;
