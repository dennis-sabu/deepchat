import mongoose, { Schema, model, models } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: Date;
}

export interface IChat {
  _id?: string;
  userId: string;
  name: string;
  messages: IMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

const ChatSchema = new Schema<IChat>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    default: "New Chat",
    trim: true,
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

ChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Chat = models.Chat || model<IChat>('Chat', ChatSchema);

export default Chat;
