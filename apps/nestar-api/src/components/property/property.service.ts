import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property } from '../../libs/dto/property/property';
import { Message } from '../../libs/enums/common.enum';
import { PropertyInput } from '../../libs/dto/property/property.input';
import { MemberService } from '../member/member.service';

@Injectable()
export class PropertyService {
    constructor(
        @InjectModel('Property') private readonly propertyModel: Model<Property>,
    private memberService:MemberService,
){} // Inject Member model

    public async createProperty(input:PropertyInput):Promise<Property>
     {
        try {
            const result = await this.propertyModel.create(input);
            //increase memberProperties
            await this.memberService.memberStatsEditor({
                _id:result.memberId,
                targetKey:"memberProperties",
                modifier:1,
            });
            return result;
          } catch (err) {
            console.error('Error during signup:', err.message); // Log the error
            throw new BadRequestException(Message.CREATE_FAILED);
          }
    }
}
