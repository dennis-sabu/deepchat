import { assets } from '@/assets/assets'
import Image from 'next/image'
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'
import gsap from 'gsap'

const Message = ({role, content, image, isLoading}) => {
  const [copiedCode, setCopiedCode] = useState(null);
  const messageRef = useRef(null);

  useEffect(() => {
    if (messageRef.current) {
      gsap.fromTo(messageRef.current, 
        { 
          opacity: 0, 
          y: 30,
          scale: 0.95
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: 'power2.out'
        }
      );
    }
  }, []);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(index);
    toast.success('Code copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied!');
  };

  return (
    <div 
      ref={messageRef}
      className='flex flex-col items-center w-full max-w-3xl text-base md:text-sm py-6 px-4'
    >
      <div className={`flex flex-col w-full ${role === 'user' && 'items-end'}`}>
        <div 
          className={`group relative flex max-w-[90%] transition-all ${
            role === 'user' 
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4 shadow-lg shadow-blue-900/20 rounded-3xl text-base' 
              : 'gap-3 w-full p-4'
          }`}
        >

          {/* Hover actions */}
          <motion.div 
            initial={{ opacity: 0, x: role === 'user' ? 10 : -10 }}
            whileHover={{ opacity: 1, x: 0 }}
            className={`absolute ${role ==='user' ? '-left-16 top-3': 'left-12 -bottom-8'} transition-all z-10`}
          >
            <div className='flex items-center gap-2 bg-gray-800/90 backdrop-blur-md px-3 py-2 rounded-full border border-gray-700/30 shadow-lg'>
              {
                role === 'user' ? (
                  <>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Image 
                        src={assets.copy_icon} 
                        alt='Copy' 
                        className='w-4 cursor-pointer hover:opacity-80 transition-opacity' 
                        onClick={copyMessage}
                      />
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Image src={assets.pencil_icon} alt='Edit' className='w-4 cursor-pointer hover:opacity-80 transition-opacity' />
                    </motion.div>
                  </>
                ):(
                  <>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Image 
                        src={assets.copy_icon} 
                        alt='Copy' 
                        className='w-4 cursor-pointer hover:opacity-80 transition-opacity'
                        onClick={copyMessage}
                      />
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Image src={assets.regenerate_icon} alt='Regenerate' className='w-4 cursor-pointer hover:opacity-80 transition-opacity' />
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Image src={assets.like_icon} alt='Like' className='w-4 cursor-pointer hover:opacity-80 transition-opacity' />
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Image src={assets.dislike_icon} alt='Dislike' className='w-4 cursor-pointer hover:opacity-80 transition-opacity' />
                    </motion.div>
                  </>
                )
              }
            </div>
          </motion.div>

          {/* Message content */}
          {
            role === 'user' ?
             (
              <div className='text-white/90'>
                {image && (
                  <img 
                    src={image} 
                    alt='Uploaded' 
                    className='max-w-full max-h-64 rounded-lg mb-2'
                  />
                )}
                <span className='whitespace-pre-wrap break-words'>{content}</span>
              </div>
            )
            :
            (
              <>
                <div className='space-y-2 w-full overflow-hidden'>
                  {isLoading ? (
                    <div className='flex items-center gap-2 py-3'>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{animationDelay: '0.2s'}}></div>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{animationDelay: '0.4s'}}></div>
                    </div>
                  ) : (
                    <div className='prose prose-invert max-w-none text-white/90 text-base md:text-sm'>
                      <ReactMarkdown 
                        components={{
                          code: ({node, inline, children}) => {
                            const codeString = String(children).replace(/\n$/, '');
                            const codeIndex = node?.position?.start?.line || Math.random();
                            
                            return inline ? (
                              <code className='bg-gray-700/80 px-2 py-1 rounded-lg text-sm md:text-xs font-mono'>
                                {children}
                              </code>
                            ) : (
                              <div className='relative group/code my-4 rounded-xl overflow-hidden shadow-md'>
                                <div className='flex items-center justify-between bg-gray-800 backdrop-blur-sm px-4 py-2.5 rounded-t-xl'>
                                  <span className='text-xs text-gray-300 font-medium'>code</span>
                                  <button
                                    onClick={() => copyToClipboard(codeString, codeIndex)}
                                    className='flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-600/80 hover:bg-gray-500/80 rounded-lg transition-colors backdrop-blur-sm'
                                  >
                                    {copiedCode === codeIndex ? (
                                      <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy code
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className='bg-gray-800 backdrop-blur-sm p-4 rounded-b-xl overflow-x-auto max-w-full'>
                                  <code className='text-sm md:text-xs font-mono block break-words whitespace-pre-wrap'>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            );
                          },
                          p: ({children}) => <div className='mb-2 whitespace-pre-wrap break-words leading-relaxed text-base md:text-sm'>{children}</div>,
                          ul: ({children}) => <ul className='list-disc ml-4 mb-2 space-y-1 text-base md:text-sm'>{children}</ul>,
                          ol: ({children}) => <ol className='list-decimal ml-4 mb-2 space-y-1 text-base md:text-sm'>{children}</ol>,
                          li: ({children}) => <li className='mb-1'>{children}</li>,
                          h1: ({children}) => <h1 className='text-2xl md:text-xl font-bold mb-3 mt-4'>{children}</h1>,
                          h2: ({children}) => <h2 className='text-xl md:text-lg font-bold mb-2 mt-3'>{children}</h2>,
                          h3: ({children}) => <h3 className='text-lg md:text-base font-bold mb-2 mt-2'>{children}</h3>,
                          blockquote: ({children}) => <blockquote className='border-l-4 border-gray-600/50 pl-4 italic my-2 rounded-r-lg bg-gray-800/20 py-2'>{children}</blockquote>,
                          a: ({children, href}) => <a href={href} target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:underline'>{children}</a>,
                        }}
                      >
                        {content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </>
            )
          }
        </div>
      </div>
    </div>
  )
}

export default Message
