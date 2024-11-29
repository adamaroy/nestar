import { Field, Int, ObjectType } from "@nestjs/graphql";
import { ObjectId } from "mongoose";
import { MemberAuthType, MemberStatus, MemberType } from "../../enums/member.enum";

@ObjectType() // Backend serverdan clientga ma'lumotni yuborishda foydalaniladi
export class Member {
    @Field(() => String)
    _id: ObjectId;

    @Field(() => MemberType)
    memberType: MemberType;

    @Field(() => MemberStatus)
    memberStatus: MemberStatus;

    @Field(() => MemberAuthType)
    memberAuthType: MemberAuthType;

    @Field(() => String)
    memberPhone: string;

    @Field(() => String)
    memberNick: string;

    @Field(() => String, { nullable: true })
    memberPassword?: string;

    @Field(() => String, { nullable: true })
    memberFullName?: string;

    @Field(() => String)
    memberImage: string;

    @Field(() => String, { nullable: true })
    memberAddress?: string;

    @Field(() => String, { nullable: true })
    memberDesc?: string;

    @Field(() => Int)
    memberProperty: number;

    @Field(() => Int)
    memberArticle: number;

    @Field(() => Int)
    memberFollowers: number;

    @Field(() => Int)
    memberFollowing: number;

    @Field(() => Int)
    memberPoints: number;

    @Field(() => Int)
    memberLikes: number;

    @Field(() => Int)
    memberViews: number;

    @Field(() => Int)
    memberComments: number;

    @Field(() => Int)
    memberRank: number;

    @Field(() => Int)
    memberWarnings: number;

    @Field(() => Int)
    memberBlocks: number;

    @Field(() => Date, { nullable: true })
    deletedAt?: Date;

    @Field(() => Date, { nullable: true })
    createdAt?: Date;

    @Field(() => Date, { nullable: true })
    updatedAt?: Date;
}
