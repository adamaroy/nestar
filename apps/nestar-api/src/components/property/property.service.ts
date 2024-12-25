import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Properties, Property } from '../../libs/dto/property/property';
import { Direction, Message } from '../../libs/enums/common.enum';
import {
    AgentPropertiesInquiry,
    AllPropertiesInquiry,
    OrdinaryInquiry,
    PropertiesInquiry,
    PropertyInput,
} from '../../libs/dto/property/property.input';
import { MemberService } from '../member/member.service';
import { StatisticModifier, T } from '../../libs/types/common';
import { PropertyStatus } from '../../libs/enums/property.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import * as moment from 'moment';
import { PropertyUpdate } from '../../libs/dto/property/property.update';
import {
    lookupAuthMemberLiked,
    lookupMember,
    shapeIntoMongoObjectId,
} from '../../libs/config';
import { LikeService } from '../like/like.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';

@Injectable()
export class PropertyService {
    constructor(
        @InjectModel('Property') private readonly propertyModel: Model<Property>,
        private memberService: MemberService,
        private viewService: ViewService,
        private likeService: LikeService, // Handles likes for properties
    ) {}

    /**
     * Creates a new property.
     */
    public async createProperty(input: PropertyInput): Promise<Property> {
        try {
            const result = await this.propertyModel.create(input);

            // Increase member property count
            await this.memberService.memberStatsEditor({
                _id: result.memberId,
                targetKey: 'memberProperties',
                modifier: 1,
            });

            return result;
        } catch (err) {
            console.error('Error during property creation:', err.message);
            throw new BadRequestException(Message.CREATE_FAILED);
        }
    }

    /**
     * Retrieves a single property by its ID.
     */
    public async getProperty(memberId: ObjectId, propertyId: ObjectId): Promise<Property> {
        const search: T = {
            _id: propertyId,
            propertyStatus: PropertyStatus.ACTIVE,
        };

        const targetProperty = await this.propertyModel.findOne(search).exec();
        if (!targetProperty) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        // Record views and likes if memberId exists
        if (memberId) {
            const viewInput = { memberId, viewRefId: propertyId, viewGroup: ViewGroup.PROPERTY };
            const newView = await this.viewService.recordView(viewInput);

            if (newView) {
                await this.propertyStatsEditor({ _id: propertyId, targetKey: 'propertyViews', modifier: 1 });
                targetProperty.propertyViews++;
            }

            // Check if the property is liked by the member
            const likeInput = {
                memberId,
                likeRefId: propertyId,
                likeGroup: LikeGroup.PROPERTY,
            };
            targetProperty.meLiked = await this.likeService.checkLikeExistence(likeInput);
        }

        targetProperty.memberData = await this.memberService.getMember(null, targetProperty.memberId);
        return targetProperty;
    }

    /**
     * Updates a property owned by the member.
     */
    public async updateProperty(memberId: ObjectId, input: PropertyUpdate): Promise<Property> {
        let { propertyStatus, soldAt, deletedAt } = input;

        const search: T = {
            _id: input._id,
            memberId,
            propertyStatus: PropertyStatus.ACTIVE,
        };

        // Handle sold or deleted status
        if (propertyStatus === PropertyStatus.SOLD) soldAt = moment().toDate();
        else if (propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();

        const result = await this.propertyModel.findOneAndUpdate(search, input, { new: true }).exec();
        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        // Decrease property count if deleted or sold
        if (soldAt || deletedAt) {
            await this.memberService.memberStatsEditor({
                _id: memberId,
                targetKey: 'memberProperties',
                modifier: -1,
            });
        }

        return result;
    }

    /**
     * Retrieves properties with filtering, sorting, and pagination.
     */
    public async getProperties(memberId: ObjectId, input: PropertiesInquiry): Promise<Properties> {
        const match: T = { propertyStatus: PropertyStatus.ACTIVE };
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        this.shapeMatchQuery(match, input);

        const result = await this.propertyModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            lookupAuthMemberLiked(memberId),
                            lookupMember,
                            { $unwind: '$memberData' },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }

    /**
     * Shapes the match query based on the input filters.
     */
    private shapeMatchQuery(match: T, input: PropertiesInquiry): void {
        const {
            memberId,
            locationList,
            roomsList,
            bedsList,
            typeList,
            periodsRange,
            pricesRange,
            squaresRange,
            options,
            text,
        } = input.search;

        if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
        if (locationList) match.propertyLocation = { $in: locationList };
        if (roomsList) match.propertyRooms = { $in: roomsList };
        if (bedsList) match.propertyBeds = { $in: bedsList };
        if (typeList) match.propertyType = { $in: typeList };

        if (pricesRange) match.propertyPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
        if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
        if (squaresRange) match.propertySquare = { $gte: squaresRange.start, $lte: squaresRange.end };

        if (text) match.propertyTitle = { $regex: new RegExp(text, 'i') };
        if (options) match['$or'] = options.map((ele) => ({ [ele]: true }));
    }

 // Get Favorites for a User
    public async getFavorites (mmeberId:ObjectId,input:OrdinaryInquiry):Promise<Properties>{
        return this.likeService.getFavoritePropersies(mmeberId,input)
    }
 // Get Visited for a User
    public async getVisited (mmeberId:ObjectId,input:OrdinaryInquiry):Promise<Properties>{
        return this.viewService.getVisitedProperties(mmeberId,input)
    }

    /**
     * Retrieves agent-owned properties.
     */
    public async getAgentProperties(memberId: ObjectId, input: AgentPropertiesInquiry): Promise<Properties> {
        const { propertyStatus } = input.search;
        if (propertyStatus === PropertyStatus.DELETE)
            throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

        const match: T = {
            memberId,
            propertyStatus: propertyStatus ?? { $ne: PropertyStatus.DELETE },
        };
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        const result = await this.propertyModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            lookupMember,
                            { $unwind: '$memberData' },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }

    /**
     * Toggles a like for a property.
     */
    public async likeTargetProperty(memberId: ObjectId, likeRefId: ObjectId): Promise<Property> {
        const target = await this.propertyModel
            .findOne({ _id: likeRefId, propertyStatus: PropertyStatus.ACTIVE })
            .exec();

        if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        const input: LikeInput = {
            memberId,
            likeRefId,
            likeGroup: LikeGroup.PROPERTY,
        };

        const modifier = await this.likeService.toggleLike(input);
        const result = await this.propertyStatsEditor({ _id: likeRefId, targetKey: 'propertyLikes', modifier });

        if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);

        return result;
    }

    /**
     * Retrieves all properties for admin use.
     */
    public async getAllPropertiesByAdmin(input: AllPropertiesInquiry): Promise<Properties> {
        const { propertyStatus, propertyLocationList } = input.search;
        const match: T = {};
        const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

        if (propertyStatus) match.propertyStatus = propertyStatus;
        if (propertyLocationList) match.propertyLocation = { $in: propertyLocationList };

        const result = await this.propertyModel
            .aggregate([
                { $match: match },
                { $sort: sort },
                {
                    $facet: {
                        list: [
                            { $skip: (input.page - 1) * input.limit },
                            { $limit: input.limit },
                            lookupMember,
                            { $unwind: '$memberData' },
                        ],
                        metaCounter: [{ $count: 'total' }],
                    },
                },
            ])
            .exec();

        if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

        return result[0];
    }

    /**
     * Updates a property by admin.
     */
    public async updatePropertyByAdmin(input: PropertyUpdate): Promise<Property> {
        let { propertyStatus, soldAt, deletedAt } = input;

        const search: T = {
            _id: input._id,
            propertyStatus: PropertyStatus.ACTIVE,
        };

        if (propertyStatus === PropertyStatus.SOLD) soldAt = moment().toDate();
        else if (propertyStatus === PropertyStatus.DELETE) deletedAt = moment().toDate();

        const result = await this.propertyModel.findOneAndUpdate(search, input, { new: true }).exec();
        if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

        if (soldAt || deletedAt) {
            await this.memberService.memberStatsEditor({
                _id: result.memberId,
                targetKey: 'memberProperties',
                modifier: -1,
            });
        }

        return result;
    }

    /**
     * Removes a property by admin.
     */
    public async removePropertyByAdmin(propertyId: ObjectId): Promise<Property> {
        const search: T = { _id: propertyId, propertyStatus: PropertyStatus.DELETE };
        const result = await this.propertyModel.findOneAndDelete(search).exec();
        if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

        return result;
    }

    /**
     * Updates property statistics like views, likes, etc.
     */
    public async propertyStatsEditor(input: StatisticModifier): Promise<Property> {
        const { _id, targetKey, modifier } = input;
        return await this.propertyModel
            .findByIdAndUpdate(
                _id,
                { $inc: { [targetKey]: modifier } },
                { new: true },
            )
            .exec();
    }
}
