import React from 'react'
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { UseAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ChatLabelProps {
  openMenu: { id: string; open: boolean };
  setOpenMenu: React.Dispatch<React.SetStateAction<{ id: string; open: boolean }>>;
}

const ChatLabel = ({ openMenu, setOpenMenu }: ChatLabelProps) => {
  const context = UseAppContext() as any;
  const { chats, selectedChat, setSelectedChat, setChats } = context;

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
      const { data } = await axios.delete(`/api/chat/${chatId}`);
      if (data.success) {
        const updatedChats = chats.filter((chat: any) => chat._id !== chatId);
        setChats(updatedChats);
        if (selectedChat?._id === chatId) {
          setSelectedChat(updatedChats[0] || null);
        }
        toast.success('Chat deleted');
        setOpenMenu({ id: '', open: false });
      }
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const handleRename = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt('Enter new name:');
    if (!newName) return;

    try {
      const { data } = await axios.put('/api/chat/rename', { chatId, name: newName });
      if (data.success) {
        setChats(chats.map((chat: any) => chat._id === chatId ? { ...chat, name: newName } : chat));
        if (selectedChat?._id === chatId) {
          setSelectedChat({ ...selectedChat, name: newName });
        }
        toast.success('Chat renamed');
        setOpenMenu({ id: '', open: false });
      }
    } catch (error) {
      toast.error('Failed to rename chat');
    }
  };

  if (!chats || chats.length === 0) return null;

  return (
    <div className='space-y-0.5'>
      {chats.map((chat: any) => {
        const isActive = selectedChat?._id === chat._id;
        return (
          <motion.div
            key={chat._id}
            onClick={() => setSelectedChat(chat)}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm group cursor-pointer transition-colors ${
              isActive ? 'bg-white/[0.06] text-white' : 'text-gray-400'
            }`}
          >
            {/* Active indicator bar */}
            {isActive && (
              <motion.div
                layoutId="activeChat"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            <p className='truncate max-w-[80%] text-[13px]'>
              {chat.name || 'New Chat'}
            </p>

            <div className='relative flex items-center justify-center h-6 w-6 aspect-square'>
              <Image
                src={assets.three_dots}
                alt='Options'
                className={`w-4 transition-opacity ${
                  openMenu.id === chat._id && openMenu.open ? 'opacity-100' : 'opacity-0'
                } group-hover:opacity-60 hover:!opacity-100`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenu({
                    id: chat._id,
                    open: openMenu.id === chat._id ? !openMenu.open : true
                  });
                }}
              />

              <AnimatePresence>
                {openMenu.id === chat._id && openMenu.open && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className='absolute z-50 -right-36 top-6 bg-surface-2/90 backdrop-blur-xl rounded-xl w-max p-1.5 border border-white/[0.06] shadow-[0_8px_24px_rgba(0,0,0,0.5)]'
                  >
                    <div
                      onClick={(e) => handleRename(chat._id, e)}
                      className='flex items-center gap-3 hover:bg-white/[0.06] px-3 py-2 rounded-lg transition-colors'
                    >
                      <Image src={assets.pencil_icon} alt='Edit' className='w-3.5' />
                      <p className='text-sm text-gray-300'>Rename</p>
                    </div>

                    <div
                      onClick={(e) => handleDelete(chat._id, e)}
                      className='flex items-center gap-3 hover:bg-red-500/10 px-3 py-2 rounded-lg text-red-400 transition-colors'
                    >
                      <Image src={assets.delete_icon} alt='Delete' className='w-3.5' />
                      <p className='text-sm'>Delete</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ChatLabel
