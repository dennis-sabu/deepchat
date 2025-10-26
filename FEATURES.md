# DeepChat Features

## ✨ What's New

### 1. **Auto-Create Chat on First Message**
- No more "No chat selected" error
- Just start typing and the chat is automatically created
- Works exactly like ChatGPT and DeepSeek

### 2. **Image Upload Support** 🖼️
- Click the "Image" button in the prompt box
- Upload images from your device
- Supports drag & drop and paste
- Max file size: 5MB
- Supported formats: JPG, PNG, GIF, WebP

### 3. **Google Gemini AI Integration** 🤖
- Powered by Google's Gemini 1.5 Flash model
- Supports both text and image understanding
- Fast and accurate responses
- Context-aware conversations

### 4. **Better Message Display**
- Markdown support for code blocks, lists, and formatting
- Smooth typing animation for AI responses
- Image previews in messages
- Clean, ChatGPT-like interface

### 5. **Enhanced Chat Management**
- Create new chats with one click
- Auto-naming based on first message
- Rename chats easily
- Delete chats you don't need
- Chat history in sidebar

### 6. **Improved UI/UX**
- Auto-scroll to latest message
- Loading indicators
- Better error messages
- Responsive design for mobile and desktop
- Smooth animations

## 🚀 How to Use

### Starting a Conversation
1. **Log in** to your account
2. **Just start typing** in the message box - no need to create a chat first!
3. Or click "New Chat" button in the sidebar

### Sending Images
1. Click the **"Image"** button in the prompt box
2. Select an image from your device
3. Add your message (optional)
4. Press Enter or click Send
5. The AI will analyze the image and respond!

### Managing Chats
- **Create**: Click "New Chat" in sidebar
- **Switch**: Click any chat in the sidebar
- **Rename**: Hover over chat → Click three dots → Rename
- **Delete**: Hover over chat → Click three dots → Delete

## 🔧 Technical Details

### API Configuration
- Uses Google Gemini API via `GOOGLE_API_KEY`
- Supports image analysis with base64 encoding
- Chat history maintained in MongoDB
- Real-time message streaming

### Models Used
- **Gemini 1.5 Flash**: Fast, efficient, supports images
- Temperature: 0.7
- Max tokens: 2000

### Key Components
- `page.jsx`: Main chat interface with auto-scroll
- `promptBox.jsx`: Message input with image upload
- `Message.jsx`: Message display with markdown
- `AppContext.jsx`: State management
- `ChatLabel.jsx`: Sidebar chat list

## 📝 Notes

- Images are stored as base64 in the database
- Keep images under 5MB for best performance
- Chat names auto-generate from first message
- All chats are private and linked to your account

## 🐛 Troubleshooting

**"No chat selected" error**: This should no longer happen! The app auto-creates chats now.

**Images not uploading**: Check file size (max 5MB) and format (image files only).

**AI not responding**: Verify `GOOGLE_API_KEY` is set in `.env.local`.

**Chat not saving**: Check MongoDB connection in console.

## 🎉 Enjoy Your Enhanced Chat Experience!

Your DeepChat now works just like ChatGPT and DeepSeek with full image support!
