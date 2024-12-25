import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { Message } from './libs/enums/common.enum';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    // Konfiguratsiya moduli: muhit o'zgaruvchilari (env) bilan ishlash uchun

    ConfigModule.forRoot(),       // GraphQL moduli sozlamalari
    GraphQLModule.forRoot({
      driver: ApolloDriver,       // Apollo GraphQL drayveri
      playground: true,           // GraphQL Playground yoqilgan
      uploads: false,             // Fayl yuklash imkoniyati o'chirilgan
      autoSchemaFile: true,       // GraphQL sxemasi avtomatik yaratiladi

      // Xatolarni formatlash (customized error handling)

      formatError: (error: T) => {
        const graphqlFormatedError = {
          code: error?.extensions.code,   // Xato kodi
          message:
            error?.extensions?.exception?.response?.message ||      // Exception ichidagi xabar
            error?.extensions?.response?.message ||                 // Javob ichidagi xabar
            error?.message, // Asosiy xabar
        };
        console.log('GRAPHQL GLOBAL ERROR:', graphqlFormatedError); // Xatolarni log qilish
        return graphqlFormatedError;
      },
    }),

    // Modullar
    ComponentsModule, 
    DatabaseModule, SocketModule, 
  ],
  controllers: [AppController],                     // REST endpointlarni boshqarish uchun
  providers: [AppService, AppResolver],             // Xizmatlar va GraphQL resolverlar
})
export class AppModule {}



//VALIDATION TURLARI
//1.HTML ORQALI VALIDATION // CLIENT VALIDATION
//2.JAVASCRIPT ORQALI VALIDATION (IKKALASIHAM FRONTEND VALIDATION)
//2.DTO   //GLOBAL,CONTROLLERLAR,RESOLVERLAR
//3.SERVER
//4.SCHEMA VALIDATION
//2.BACKEND VALIDATION (PIPE VALIDATION =BACKENDGA KIRIB KELGAN MALUMOT TOGRI EKANINI CHECK)
//3.BACKEND PASSWORD VA DB dagi PASSWORD CHECK 
//4.SCHEMA VALIDATION (FRONTDAN YOKI SERVER YOKI BACKEND DAN OTGAN HATONI USHLAYDI)


//PIPELAR 2 HIL USULDA ISHLAYDI
//1.TRANSFORMATION
//2.VALIDATION