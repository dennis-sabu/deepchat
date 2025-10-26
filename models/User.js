import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    image: { type: String }, // `required: false` is default, so can be omitted
    limitResetTime: { type: Date, default: () => new Date() }, // Track when the 8-hour period started
  },
  { timestamps: true }
);

// Use `models.User` if it exists (to prevent overwrite errors in dev)
const User = models.User || model('User', UserSchema);

export default User;
