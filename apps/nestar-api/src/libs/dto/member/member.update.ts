import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsOptional, Length, IsEnum, IsString } from "class-validator";
import { MemberAuthType, MemberStatus, MemberType } from "../../enums/member.enum";
import { Types } from "mongoose";

@InputType()
export class MemberUpdate {
    @IsNotEmpty()
    @Field(() => String)
    _id: Types.ObjectId;

    @IsOptional()
    @IsEnum(MemberType)
    @Field(() => MemberType, { nullable: true })
    memberType?: MemberType;

    @IsOptional()
    @IsEnum(MemberStatus)
    @Field(() => MemberStatus, { nullable: true })
    memberStatus?: MemberStatus;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    memberPhone?: string;

    @IsOptional()
    @IsString()
    @Length(3, 12)
    @Field(() => String, { nullable: true })
    memberNick?: string;

    @IsOptional()
    @IsString()
    @Length(5, 12)
    @Field(() => String, { nullable: true })
    memberPassword?: string;

    @IsOptional()
    @IsString()
    @Length(3, 100)
    @Field(() => String, { nullable: true })
    memberFullName?: string;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    memberImage?: string;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    memberAddress?: string;

    @IsOptional()
    @IsString()
    @Field(() => String, { nullable: true })
    memberDesx?: string;
}
