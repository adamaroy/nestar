import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { AgentsInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import { T } from '../../libs/types/common';
import { ViewService } from '../view/view.service';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';

@Injectable()
export class MemberService {
  constructor(
    @InjectModel('Member') private readonly memberModel: Model<Member>, // Inject Member model
    private authService: AuthService, // Service for auth utilities
    private viewService: ViewService, // Service for tracking views
  ) {}

  public async signup(input: MemberInput): Promise<Member> {
    input.memberPassword = await this.authService.hashPassword(input.memberPassword);
    try {
      const result = await this.memberModel.create(input);
      result.accessToken = await this.authService.createToken(result); // Generate access token
      return result;
    } catch (err) {
      console.error('Error during signup:', err.message); // Log the error
      throw new BadRequestException(Message.USED_MEMBER_NICK_OR_PHONE);
    }
  }

  public async login(input: LoginInput): Promise<Member> {
    const { memberNick, memberPassword } = input;
    const response = await this.memberModel
      .findOne({ memberNick })
      .select('+memberPassword') // Select password for comparison
      .exec();

    if (!response || response.memberStatus === MemberStatus.DELETE) {
      throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
    }

    if (response.memberStatus === MemberStatus.BLOCK) {
      throw new InternalServerErrorException(Message.BLOCKED_USER);
    }

    const isMatch = await this.authService.comparePassword(memberPassword, response.memberPassword);
    if (!isMatch) throw new InternalServerErrorException(Message.WRONG_PASSWORD);

    response.accessToken = await this.authService.createToken(response); // Refresh access token
    return response;
  }

  public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
    console.log('Update input:', input); // Debug input

    const result = await this.memberModel
      .findOneAndUpdate(
        { _id: memberId, memberStatus: MemberStatus.ACTIVE },
        input,
        { new: true },
      )
      .exec();

    if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

    result.accessToken = await this.authService.createToken(result); // Refresh token
    return result;
  }

  public async getMember(memberId: ObjectId, targetId: ObjectId): Promise<Member> {
    const search: T = {
      _id: targetId,
      memberStatus: { $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK] },
    };

    const targetMember = await this.memberModel.findOne(search).lean().exec();
    if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

    if (memberId) {
      const viewInput: ViewInput = {
        memberId,
        viewRefId: targetId,
        viewGroup: ViewGroup.MEMBER,
      };

      const newView = await this.viewService.recordView(viewInput);
      if (newView) {
        await this.memberModel
          .findByIdAndUpdate(targetId, { $inc: { memberViews: 1 } }, { new: true })
          .exec();
        targetMember.memberViews++;
      }
    }

    return targetMember as Member;
  }

  public async getAgents(memberId: ObjectId, input: AgentsInquiry): Promise<Members> {
    const { text } = input.search;

    const match: T = {
      memberType: MemberType.AGENT,
      memberStatus: MemberStatus.ACTIVE,
    };

    if (text) match.memberNick = { $regex: new RegExp(text, 'i') };

    const sort: T = {
      [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
    };

    console.log('match:', match); // Log match criteria for debugging

    const result = await this.memberModel
      .aggregate([
        { $match: match }, // Filter active agents
        { $sort: sort }, // Sort based on input
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();


    if (!result.length || !result[0].metaCounter.length) {
      throw new InternalServerErrorException(Message.NO_DATA_FOUND); // No agents found
    }

    return result[0]; // Return the list and metadata
  }

  public async getAllMembersByAdmin(input:MembersInquiry): Promise<Members> {

    const {memberStatus,memberType, text } = input.search;

    const match: T = {};
    const sort: T = {
        [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC,
      };
  
    if(memberStatus)match.memberStatus = memberStatus;
    if(memberType)match.memberType = memberType;

    if (text) match.memberNick = { $regex: new RegExp(text, 'i') };

    
    console.log('match:', match); // Log match criteria for debugging

    const result = await this.memberModel
      .aggregate([
        { $match: match }, // Filter active agents
        { $sort: sort }, // Sort based on input
        {
          $facet: {
            list: [
              { $skip: (input.page - 1) * input.limit },
              { $limit: input.limit },
            ],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ])
      .exec();


    if (!result.length )
      throw new InternalServerErrorException(Message.NO_DATA_FOUND); // No agents found
    

    return result[0]; // Return the list and metadata
  }

  public async updateMemberByAdmin(input:MemberUpdate): Promise<Member> {
    const result:Member =await this.memberModel.findOneAndUpdate({_id: input._id},input,{new:true}).exec();
    if(!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
    return result;
  }
}
