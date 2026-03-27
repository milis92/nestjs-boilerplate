import {
  Inject,
  Injectable,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';

/**
 * Automatically discovers all BullMQ queues registered via
 * `BullModule.registerQueue()` and adds them to the Bull Board UI.
 *
 * Uses NestJS `DiscoveryService` to scan for `Queue` provider instances
 * at startup, eliminating the need for manual `BullBoardModule.forFeature()`
 * calls in each domain module.
 *
 * The board injection is `@Optional()` because `BullBoardModule.forRoot()`
 * is conditionally registered (excluded in production).
 */
@Injectable()
export class BullBoardDiscovery implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    @Optional()
    @Inject('bull_board_instance')
    private readonly board?: {
      addQueue: (queue: BullMQAdapter) => void;
    },
  ) {}

  onModuleInit(): void {
    if (!this.board) return;

    for (const wrapper of this.discovery.getProviders()) {
      if (wrapper.instance instanceof Queue) {
        this.board.addQueue(new BullMQAdapter(wrapper.instance));
      }
    }
  }
}
