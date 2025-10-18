import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MAIL_FROM, MAIL_HOST, MAIL_PASSWORD, MAIL_PORT, MAIL_USER } from 'src/config/constants';
import { join } from 'path';
  import {HandlebarsAdapter} from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports:[
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService)=>({
        transport:{
          host: config.get<string>(MAIL_HOST),
          port: config.get<number>(MAIL_PORT),
          secure:false,
          auth:{
            user:config.get<string>(MAIL_USER),
            pass:config.get<string>(MAIL_PASSWORD),
          },
        },
        defaults:{
          from: ` "no-reply" <${config.get<string>(MAIL_FROM)}>`,
        },
        template:{
          dir: join(__dirname, 'template'),
          adapter: new  HandlebarsAdapter(),
          options:{
            strict:true
          },
        },
      }),
      inject:[ConfigService]
    })
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}