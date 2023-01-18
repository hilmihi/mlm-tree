import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TreeController } from './controllers/tree.controller';
import { MemberSchema } from './schemas/tree.schema';
import { TreeService } from './services/tree.service';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://mlm-user:mlmtree123@cluster-mlm.efozutu.mongodb.net/test',
    ),
    MongooseModule.forFeature([{ name: 'Member', schema: MemberSchema }]),
  ],
  controllers: [AppController, TreeController],
  providers: [AppService, TreeService],
})
export class AppModule {}
