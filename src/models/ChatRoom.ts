import { Schema, model, Document } from "mongoose";
import type { ObjectId } from "../types/index.js";

export interface ITypingLog {
  userId: ObjectId;
  action: "START" | "STOP";
  timestamp: Date;
}

export interface IChatRoom extends Document {
  _id: ObjectId;
  buyerId: ObjectId;
  sellerId: ObjectId;
  itemId: ObjectId;
  unreadCount: { buyer: number; seller: number };
  status: "ACTIVE" | "ARCHIVED";
  lastMessage?: string;
  lastMessageAt: Date;
  typingLogs: ITypingLog[];
}

const chatRoomSchema = new Schema<IChatRoom>(
  {
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    unreadCount: {
      buyer: { type: Number, default: 0 },
      seller: { type: Number, default: 0 },
    },
    status: { type: String, enum: ["ACTIVE", "ARCHIVED"], default: "ACTIVE" },
    lastMessage: String,
    lastMessageAt: { type: Date, default: Date.now },
    typingLogs: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        action: { type: String, enum: ["START", "STOP"], required: true },
        timestamp: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

chatRoomSchema.index({ buyerId: 1, sellerId: 1, itemId: 1 }, { unique: true });
chatRoomSchema.index({ lastMessageAt: -1 });

export const ChatRoom = model<IChatRoom>("ChatRoom", chatRoomSchema);
