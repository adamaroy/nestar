import { Field, Int, ObjectType } from "@nestjs/graphql";
import { ObjectId } from "mongoose";
import { ViewGroup } from "../../enums/view.enum";

@ObjectType() // Backend serverdan clientga ma'lumotni yuborishda foydalaniladi
export class View {
    @Field(() => String)
    _id: ObjectId;

    @Field(() => ViewGroup)
    viewGroup: ViewGroup;

    @Field(() => String)
    viewRefId: ObjectId;

    @Field(() => String)
    memberId: ObjectId;

    @Field(() => Date, { nullable: true })
    createdAt?: Date;

    @Field(() => Date, { nullable: true })
    updatedAt?: Date;

    

}
