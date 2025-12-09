import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export type LeadRealtimeAction = 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned';

export interface LeadRealtimeEvent {
  action: LeadRealtimeAction;
  leadId: string;
  schoolId: string;
  payload?: Record<string, any>;
}

export interface StatsEventPayload {
  schoolId: string;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*', credentials: false },
})
export class RealtimeGateway {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  emitLeadChange(event: LeadRealtimeEvent): void {
    this.server?.emit('lead.change', event);
    this.logger.debug(`Emitted lead.change for lead ${event.leadId} (${event.action})`);
  }

  emitLeadStatsChange(schoolId: string): void {
    this.emitStatsEvent('lead.stats', schoolId);
  }

  emitInvoiceStatsChange(schoolId: string): void {
    this.emitStatsEvent('invoice.stats', schoolId);
  }

  private emitStatsEvent(eventName: string, schoolId: string): void {
    this.server?.emit(eventName, { schoolId } satisfies StatsEventPayload);
    this.logger.debug(`Emitted ${eventName} for school ${schoolId}`);
  }
}







