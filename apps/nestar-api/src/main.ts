import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MaxFileSizeValidator, ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import {graphqlUploadExpress} from "graphql-upload";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes (new ValidationPipe());   //Global validation integration
  app.useGlobalInterceptors (new LoggingInterceptor());
  app.enableCors({origin:true,credentials:true}); //serverga data uchun 
  
  app.use(graphqlUploadExpress({MaxFileSize:15000000,maxFiles:10}));
  app.use("/uploads",express.static("./uploads")); //uploadni tashqariga ochamiz
  
  await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
