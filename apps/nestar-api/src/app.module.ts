import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigModule} from '@nestjs/config';
import {GraphQLModule} from '@nestjs/graphql';
import {ApolloDriver} from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { Message } from './libs/enums/common.enum';

@Module({
  imports: 
  [
    ConfigModule.forRoot(),
    GraphQLModule.forRoot({
    driver:ApolloDriver,
    playground:true,
    uploads:false,
    autoSchemaFile:true,

    //CUSTOMIZED ERROR 

    formatError: (error: T)=>{
      const graphqlFormatedError = {
        code: error?.extensions.code,
        message: 
          error?.extensions?.exception?.response?.message || 
          error?.extensions?.response?.message || 
          error?.message,

      };
      console.log("GRAPHQL GLOBAL ERROR:",graphqlFormatedError);
      return graphqlFormatedError;
      
      
    }
  }), ComponentsModule, DatabaseModule,
],
  controllers: [AppController],
  providers: [AppService,AppResolver],
})
export class AppModule {}



//VALIDATION TURLARI
//1.HTML ORQALI VALIDATION
//2.JAVASCRIPT ORQALI VALIDATION (IKKALASIHAM FRONTEND VALIDATION)

//2.BACKEND VALIDATION (PIPE VALIDATION =BACKENDGA KIRIB KELGAN MALUMOT TOGRI EKANINI CHECK)
//3.BACKEND PASSWORD VA DB dagi PASSWORD CHECK 
//4.SCHEMA VALIDATION (FRONTDAN YOKI SERVER YOKI BACKEND DAN OTGAN HATONI USHLAYDI)


//PIPELAR 2 HIL USULDA ISHLAYDI
//1.TRANSFORMATION
//2.VALIDATION