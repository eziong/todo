import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TagsModule } from './modules/tags/tags.module';
import { TodosModule } from './modules/todos/todos.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { BuildCommandsModule } from './modules/build-commands/build-commands.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { ActivityModule } from './modules/activity/activity.module';
import { BuildsModule } from './modules/builds/builds.module';
import { NotesModule } from './modules/notes/notes.module';
import { LinksModule } from './modules/links/links.module';
import { ContentsModule } from './modules/contents/contents.module';
import { GoogleModule } from './modules/google/google.module';
import { YouTubeModule } from './modules/youtube/youtube.module';
import { DriveModule } from './modules/drive/drive.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { SponsorshipsModule } from './modules/sponsorships/sponsorships.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AssetsModule } from './modules/assets/assets.module';
import { BackupModule } from './modules/backup/backup.module';
import { UndoModule } from './modules/undo/undo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UndoModule,
    TagsModule,
    TodosModule,
    ProjectsModule,
    BuildCommandsModule,
    InboxModule,
    ActivityModule,
    BuildsModule,
    NotesModule,
    LinksModule,
    ContentsModule,
    GoogleModule,
    YouTubeModule,
    DriveModule,
    WebhooksModule,
    SponsorshipsModule,
    NotificationsModule,
    AssetsModule,
    BackupModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
