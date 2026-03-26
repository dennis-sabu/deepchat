import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  email?: string;
  image?: string;
  limitResetTime: Date;
  warnings: number;
  bannedUntil?: Date | null;
  isAdmin: boolean;
  hasUnlimitedChats: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String },
    image: { type: String },
    limitResetTime: { type: Date, default: () => new Date() },
    warnings: { type: Number, default: 0 },
    bannedUntil: { type: Date, default: null },
    isAdmin: { type: Boolean, default: false },
    hasUnlimitedChats: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = models.User || model<IUser>('User', UserSchema);

export default User;
