import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import { MemberModule } from '../member/member.module';
import CommentSchema from '../../schemas/Comment.model';
import { PropertyModule } from '../property/property.module';
import { BoardArticle } from '../../libs/dto/board-article/board-article';

@Module({
  imports:[
    MongooseModule.forFeature([
      {
        name:"Comment",
        schema:CommentSchema
      },
    ]),
    
    AuthModule,
    MemberModule,
    PropertyModule,
    BoardArticle
  ],
  providers: [CommentService, CommentResolver],
})
export class CommentModule {}
