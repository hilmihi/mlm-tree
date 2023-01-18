import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type MemberDocument = mongoose.HydratedDocument<Member>;

@Schema({ collection: 'Member' })
export class Member {
  @Prop()
  value: string;

  @Prop()
  level: number;

  @Prop()
  bonus: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Member' })
  parent: Member;

  @Prop({ type: Map })
  children: Map<string, MemberDocument>;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
