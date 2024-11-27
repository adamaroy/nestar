import { Injectable } from '@nestjs/common';

@Injectable()
export class MemberService {
    public async signup():Promise <string>{
    return "signup executed!";
    }

    public async login():Promise <string>{
        return "signup executed!";
        }

    public async updateMember():Promise <string>{
        return "signup executed!";
        }

     public async getMember():Promise <string>{
        return "signup executed!";
        }
}