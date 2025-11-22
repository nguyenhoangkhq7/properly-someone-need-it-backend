// src/models/Message.ts
import { Schema, model, Document } from "mongoose";
import type { ObjectId } from "../types/index";

export interface IMessage extends Document {
  _id: ObjectId;
  chatRoomId: ObjectId;
  senderId: ObjectId;
  content?: string;
  messageType: "TEXT" | "IMAGE" | "LOCATION" | "MEETUP_CONFIRM";
  attachmentUrl?: string; // áº£nh hoáº·c JSON Ä‘á»‹a Ä‘iá»ƒm

  sentAt: Date;
  isRead: boolean;
}

const messageSchema = new Schema<IMessage>(
  {
    chatRoomId: {
      type: Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: String,
    messageType: {
      type: String,
      enum: ["TEXT", "IMAGE", "LOCATION", "MEETUP_CONFIRM"],
      default: "TEXT",
    },
    attachmentUrl: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "sentAt", updatedAt: false } }
);

messageSchema.index({ chatRoomId: 1, sentAt: -1 });

export const Message = model<IMessage>("Message", messageSchema);

