import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NoteFoldersController } from './note-folders.controller';
import { NotesService } from './notes.service';
import { NoteFoldersService } from './note-folders.service';

@Module({
  controllers: [NotesController, NoteFoldersController],
  providers: [NotesService, NoteFoldersService],
})
export class NotesModule {}
