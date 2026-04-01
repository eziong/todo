import { Global, Module } from '@nestjs/common';
import { UndoController } from './undo.controller';
import { UndoService } from './undo.service';

@Global()
@Module({
  controllers: [UndoController],
  providers: [UndoService],
  exports: [UndoService],
})
export class UndoModule {}
