import { assets } from '@/assets/assets'
import Image from 'next/image'
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  isLoading?: boolean;
}

const Message = ({ role, content, image, isLoading }: MessageProps) => {
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const [showActions, setShowActions] = useState(false);

  const copyToClipboard = (text: string, index: number) => {
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className='flex flex-col items-center w-full max-w-3xl py-4 px-4'
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex flex-col w-full ${role === 'user' && 'items-end'}`}>
        {/* Role Label */}
        <div className={`flex items-center gap-2 mb-1.5 ${role === 'user' ? 'justify-end' : ''}`}>
          <span className='text-[11px] uppercase tracking-wider text-gray-500 font-medium'>
            {role === 'user' ? 'You' : 'DeepChat'}
          </span>
        </div>

        <div
          className={`group relative flex max-w-[90%] transition-all ${
            role === 'user'
              ? 'bg-white/[0.06] backdrop-blur-sm px-4 py-3 rounded-2xl rounded-tr-md border border-white/[0.06]'
              : 'w-full'
          }`}
        >
          {/* Hover Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={showActions ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-10 ${
              role === 'user' ? '-left-14 top-2' : 'right-0 -bottom-7'
            }`}
          >
            <div className='flex items-center gap-1 bg-surface-2/90 backdrop-blur-xl px-2 py-1.5 rounded-lg border border-white/[0.06] shadow-[0_4px_16px_rgba(0,0,0,0.4)]'>
              {role === 'user' ? (
                <>
                  <button onClick={copyMessage} className='p-1.5 hover:bg-white/[0.06] rounded-md transition-colors' title='Copy'>
                    <Image src={assets.copy_icon} alt='Copy' className='w-3.5' />
                  </button>
                  <button className='p-1.5 hover:bg-white/[0.06] rounded-md transition-colors' title='Edit'>
                    <Image src={assets.pencil_icon} alt='Edit' className='w-3.5' />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={copyMessage} className='p-1.5 hover:bg-white/[0.06] rounded-md transition-colors' title='Copy'>
                    <Image src={assets.copy_icon} alt='Copy' className='w-3.5' />
                  </button>
                  <button className='p-1.5 hover:bg-white/[0.06] rounded-md transition-colors' title='Regenerate'>
                    <Image src={assets.regenerate_icon} alt='Regenerate' className='w-3.5' />
                  </button>
                  <button className='p-1.5 hover:bg-white/[0.06] rounded-md transition-colors' title='Like'>
                    <Image src={assets.like_icon} alt='Like' className='w-3.5' />
                  </button>
                  <button className='p-1.5 hover:bg-white/[0.06] rounded-md transition-colors' title='Dislike'>
                    <Image src={assets.dislike_icon} alt='Dislike' className='w-3.5' />
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {role === 'user' ? (
            <div className='text-gray-200'>
              {image && (
                <div className='p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-2 inline-block'>
                  <img src={image} alt='Uploaded' className='max-w-full max-h-64 rounded-lg' />
                </div>
              )}
              <span className='whitespace-pre-wrap break-words text-[15px] leading-relaxed'>{content}</span>
            </div>
          ) : (
            <div className='space-y-1 w-full overflow-hidden'>
              {isLoading ? (
                /* Shimmer Loading */
                <div className='space-y-3 py-2'>
                  <div className='h-4 w-3/4 rounded-lg bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer' />
                  <div className='h-4 w-1/2 rounded-lg bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer' style={{ animationDelay: '0.15s' }} />
                  <div className='h-4 w-2/3 rounded-lg bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-shimmer' style={{ animationDelay: '0.3s' }} />
                </div>
              ) : (
                <div className='prose prose-invert max-w-none text-gray-300 text-[15px]'>
                  <ReactMarkdown
                    components={{
                      code: ({ node, inline, children, ...props }: any) => {
                        const codeString = String(children).replace(/\n$/, '');
                        const codeIndex = node?.position?.start?.line || Math.random();

                        return inline ? (
                          <code className='bg-white/[0.06] text-blue-300 px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-white/[0.04]'>
                            {children}
                          </code>
                        ) : (
                          <div className='relative group/code my-4 rounded-xl overflow-hidden border border-white/[0.06]'>
                            <div className='flex items-center justify-between bg-[#1a1b26] px-4 py-2.5'>
                              <span className='text-[11px] text-gray-500 font-mono uppercase tracking-wider'>code</span>
                              <button
                                onClick={() => copyToClipboard(codeString, codeIndex)}
                                className='flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-all'
                              >
                                {copiedCode === codeIndex ? (
                                  <>
                                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className='bg-[#1a1b26] p-4 overflow-x-auto max-w-full'>
                              <code className='text-[13px] font-mono block break-words whitespace-pre-wrap text-gray-300'>
                                {children}
                              </code>
                            </pre>
                          </div>
                        );
                      },
                      p: ({ children }: any) => <div className='mb-3 whitespace-pre-wrap break-words leading-[1.8] text-[15px] text-gray-300'>{children}</div>,
                      ul: ({ children }: any) => <ul className='list-disc ml-5 mb-3 space-y-1.5 text-[15px] text-gray-300'>{children}</ul>,
                      ol: ({ children }: any) => <ol className='list-decimal ml-5 mb-3 space-y-1.5 text-[15px] text-gray-300'>{children}</ol>,
                      li: ({ children }: any) => <li className='mb-1 leading-[1.7]'>{children}</li>,
                      h1: ({ children }: any) => <h1 className='text-2xl font-bold mb-3 mt-5 text-white tracking-tight' style={{ fontFamily: 'var(--font-geist-sans)' }}>{children}</h1>,
                      h2: ({ children }: any) => <h2 className='text-xl font-bold mb-2.5 mt-4 text-white tracking-tight' style={{ fontFamily: 'var(--font-geist-sans)' }}>{children}</h2>,
                      h3: ({ children }: any) => <h3 className='text-lg font-semibold mb-2 mt-3 text-white tracking-tight' style={{ fontFamily: 'var(--font-geist-sans)' }}>{children}</h3>,
                      blockquote: ({ children }: any) => <blockquote className='border-l-2 border-primary/40 pl-4 italic my-3 text-gray-400'>{children}</blockquote>,
                      a: ({ children, href }: any) => <a href={href} target='_blank' rel='noopener noreferrer' className='text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 transition-colors underline-offset-2'>{children}</a>,
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Message
