import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class EventsService extends EventEmitter {
  constructor(){
    super();
  }
}
