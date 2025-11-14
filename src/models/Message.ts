import { Schema, model, Document } from "mongoose";
import type { ObjectId } from "../types/index.js";

export interface IMessage extends Document {
  _id: ObjectId;
  chatRoomId: ObjectId;
  senderId: ObjectId;
  content: string;
  sentAt: Date;
  read: boolean;
}

const messageSchema = new Schema<IMessage>(
  {
    chatRoomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "sentAt", updatedAt: false } }
);

messageSchema.index({ chatRoomId: 1, sentAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);
