import mongoose, { Schema, model, models } from 'mongoose';

const ChatSchema = new Schema(
  {
   
    name: { type: String, required: true },
   messages: [
    {
      role: { type: String, required: true }, // 'user' or 'assistant'
      content: { type: String, required: true },
      timestamps: { type: Number, required: true } // Automatically set the timestamp
    }
   ],
   UserId: { type: String, required: true }, // Reference to the User model
  },
  { timestamps: true }
);

// Use `models.Chat` if it exists (to prevent overwrite errors in dev)
const Chat = mongoose.model.Chat || mongoose.model("Chat", ChatSchema);

export default Chat;
