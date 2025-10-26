import React from 'react'
import Image from 'next/image';
import { assets } from '@/assets/assets';
import { UseAppContext } from '@/context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const ChatLabel = ({ openMenu, setOpenMenu }) => {
  const { chats, selectedChat, setSelectedChat, setChats } = UseAppContext();

  const handleDelete = async (chatId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
      const { data } = await axios.delete(`/api/chat/${chatId}`);

      if (data.success) {
        const updatedChats = chats.filter(chat => chat._id !== chatId);
        setChats(updatedChats);
        
        if (selectedChat?._id === chatId) {
          setSelectedChat(updatedChats[0] || null);
        }
        
        toast.success('Chat deleted');
        setOpenMenu({ id: 0, open: false });
      }
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const handleRename = async (chatId, e) => {
    e.stopPropagation();
    
    const newName = prompt('Enter new name:');
    if (!newName) return;

    try {
      const { data } = await axios.put('/api/chat/rename', { 
        chatId, 
        name: newName 
      });

      if (data.success) {
        setChats(chats.map(chat => 
          chat._id === chatId ? { ...chat, name: newName } : chat
        ));
        
        if (selectedChat?._id === chatId) {
          setSelectedChat({ ...selectedChat, name: newName });
        }
        
        toast.success('Chat renamed');
        setOpenMenu({ id: 0, open: false });
      }
    } catch (error) {
      toast.error('Failed to rename chat');
    }
  };

  if (!chats || chats.length === 0) {
    return null;
  }

  return (
    <div className='space-y-1'>
      {chats.map((chat) => (
        <div 
          key={chat._id}
          onClick={() => setSelectedChat(chat)}
          className={`flex items-center justify-between p-2 hover:bg-white/10 rounded-lg text-sm group cursor-pointer ${
            selectedChat?._id === chat._id ? 'bg-white/10 text-white' : 'text-white/80'
          }`}
        >
          <p className='truncate max-w-[80%]'>
            {chat.name || 'New Chat'}
          </p>
          <div className='relative flex items-center justify-center h-6 w-6 aspect-square'>
            <Image 
              src={assets.three_dots} 
              alt='Options' 
              className={`w-4 ${openMenu.id === chat._id && openMenu.open ? '' : 'hidden'} group-hover:block`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu({ 
                  id: chat._id, 
                  open: openMenu.id === chat._id ? !openMenu.open : true 
                });
              }}
            />

            {openMenu.id === chat._id && openMenu.open && (
              <div className='absolute z-50 -right-36 top-6 bg-gray-700 rounded-xl w-max p-2'>
                <div 
                  onClick={(e) => handleRename(chat._id, e)}
                  className='flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg'
                >
                  <Image src={assets.pencil_icon} alt='Edit' className='w-4' />
                  <p>Rename</p>
                </div>

                <div 
                  onClick={(e) => handleDelete(chat._id, e)}
                  className='flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg text-red-400'
                >
                  <Image src={assets.delete_icon} alt='Delete' className='w-4' />
                  <p>Delete</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatLabel