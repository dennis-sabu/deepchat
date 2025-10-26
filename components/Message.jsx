import { assets } from '@/assets/assets'
import Image from 'next/image'
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

const Message = ({role, content, image, isLoading}) => {
  const [copiedCode, setCopiedCode] = useState(null);

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
    <div className='flex flex-col items-center w-full max-w-3xl text-sm py-4'>
      <div className={`flex flex-col w-full mb-4 ${role === 'user' && 'items-end'}`}>
        <div className={`group relative flex max-w-[90%] py-3 rounded-xl ${role === 'user' ? 'bg-[#414158] px-5' : 'gap-3 w-full'}`}>

          {/* Hover actions */}
          <div className={`opacity-0 group-hover:opacity-100 absolute ${role ==='user' ? '-left-16 top-2.5': 'left-9 -bottom-6'} transition-all z-10`}>
            <div className='flex items-center gap-2 opacity-70'>
              {
                role === 'user' ? (
                  <>
                    <Image 
                      src={assets.copy_icon} 
                      alt='Copy' 
                      className='w-4 cursor-pointer hover:opacity-90' 
                      onClick={copyMessage}
                    />
                    <Image src={assets.pencil_icon} alt='Edit' className='w-4 cursor-pointer hover:opacity-90' />
                  </>
                ):(
                  <>
                    <Image 
                      src={assets.copy_icon} 
                      alt='Copy' 
                      className='w-4 cursor-pointer hover:opacity-90'
                      onClick={copyMessage}
                    />
                    <Image src={assets.regenerate_icon} alt='Regenerate' className='w-4 cursor-pointer hover:opacity-90' />
                    <Image src={assets.like_icon} alt='Like' className='w-4 cursor-pointer hover:opacity-90' />
                    <Image src={assets.dislike_icon} alt='Dislike' className='w-4 cursor-pointer hover:opacity-90' />
                  </>
                )
              }
            </div>
          </div>

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
                <Image 
                  src={assets.logo_icon} 
                  alt='Logo' 
                  className='h-9 w-9 p-1 border border-white/15 rounded-full flex-shrink-0'
                />
                <div className='space-y-2 w-full overflow-hidden'>
                  {isLoading ? (
                    <div className='flex items-center gap-2 py-3'>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{animationDelay: '0.2s'}}></div>
                      <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{animationDelay: '0.4s'}}></div>
                    </div>
                  ) : (
                    <div className='prose prose-invert max-w-none text-white/90'>
                      <ReactMarkdown 
                        components={{
                          code: ({node, inline, children}) => {
                            const codeString = String(children).replace(/\n$/, '');
                            const codeIndex = node?.position?.start?.line || Math.random();
                            
                            return inline ? (
                              <code className='bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono'>
                                {children}
                              </code>
                            ) : (
                              <div className='relative group/code my-4'>
                                <div className='flex items-center justify-between bg-gray-700 px-4 py-2 rounded-t-lg'>
                                  <span className='text-xs text-gray-300 font-medium'>code</span>
                                  <button
                                    onClick={() => copyToClipboard(codeString, codeIndex)}
                                    className='flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded transition-colors'
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
                                <pre className='bg-gray-800 p-4 rounded-b-lg overflow-x-auto'>
                                  <code className='text-sm font-mono'>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            );
                          },
                          p: ({children}) => <div className='mb-2 whitespace-pre-wrap break-words leading-relaxed'>{children}</div>,
                          ul: ({children}) => <ul className='list-disc ml-4 mb-2 space-y-1'>{children}</ul>,
                          ol: ({children}) => <ol className='list-decimal ml-4 mb-2 space-y-1'>{children}</ol>,
                          li: ({children}) => <li className='mb-1'>{children}</li>,
                          h1: ({children}) => <h1 className='text-2xl font-bold mb-3 mt-4'>{children}</h1>,
                          h2: ({children}) => <h2 className='text-xl font-bold mb-2 mt-3'>{children}</h2>,
                          h3: ({children}) => <h3 className='text-lg font-bold mb-2 mt-2'>{children}</h3>,
                          blockquote: ({children}) => <blockquote className='border-l-4 border-gray-600 pl-4 italic my-2'>{children}</blockquote>,
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
