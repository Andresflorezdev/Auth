import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (
      _,
      ret: {
        _id?: unknown;
        __v?: number;
        password?: string;
        passwordBackup?: string;
        refreshToken?: string;
        id?: unknown;
      },
    ) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.passwordBackup;
      delete ret.refreshToken;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  passwordBackup?: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isSeeded: boolean;

  @Prop({ default: 0 })
  tokenVersion: number;

  @Prop()
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ isSeeded: 1 });
