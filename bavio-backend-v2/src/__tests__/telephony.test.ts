import { WebhookController } from '../controllers/webhook.controller';
import { RoutingService } from '../services/routing.service';
import { PoolService } from '../services/pool.service';
import { supabase } from '../database/supabase';
import { redisClient } from '../redis/redis.client';
import { Request, Response } from 'express';

// Mock Supabase
jest.mock('../database/supabase', () => {
  const createMockChain = (defaultData: any = {}) => {
    const chain: any = {};
    const mockFn = jest.fn().mockImplementation(() => chain);
    
    Object.assign(chain, {
      select: mockFn,
      insert: mockFn,
      update: mockFn,
      delete: mockFn,
      eq: mockFn,
      lt: mockFn,
      gt: mockFn,
      order: mockFn,
      limit: mockFn,
      single: jest.fn().mockImplementation(() => Promise.resolve({ data: defaultData, error: null })),
      then: jest.fn().mockImplementation((resolve: any) => resolve({ data: Array.isArray(defaultData) ? defaultData : [defaultData], error: null }))
    });

    return chain;
  };

  const defaultChain = createMockChain();
  return {
    supabase: {
      from: jest.fn().mockReturnValue(defaultChain),
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      createMockChain
    }
  };
});

const { createMockChain } = supabase as any;

// Mock Redis client
jest.mock('../redis/redis.client', () => {
  return {
    redisClient: {
      hmset: jest.fn(),
      hgetall: jest.fn(),
      hset: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
      on: jest.fn()
    }
  };
});

describe('Bavio Telephony - Dedicated Number Routing Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRequest = { body: {}, query: {} };
    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    // Reset default mock behaviors
    const defaultChain = createMockChain();
    (supabase.from as jest.Mock).mockReturnValue(defaultChain);
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });
  });

  describe('Pool Assignment Logic', () => {
    it('should assign a business to an available active pool number', async () => {
      const poolChain = createMockChain([{ id: 101, active_customers: 0, max_concurrent_calls: 50 }]);
      const phoneChain = createMockChain({ id: 1 });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'exotel_pools') return poolChain;
        if (table === 'phone_numbers') return phoneChain;
        return createMockChain();
      });

      const poolId = await PoolService.assignToPool(12, '+919876522222');

      expect(poolId).toBe(101);
      expect(supabase.from).toHaveBeenCalledWith('exotel_pools');
      expect(poolChain.lt).toHaveBeenCalledWith('active_customers', 1); // Max 1 customer
      expect(phoneChain.insert).toHaveBeenCalledWith({
        business_id: 12,
        original_number: '+919876522222',
        forwarding_enabled: true,
        verification_status: 'verified',
        exotel_pool_id: 101
      });
      expect(supabase.rpc).toHaveBeenCalledWith('increment_pool_customers', { pool_id_input: 101 });
    });

    it('should fail to assign when no active pools are available under capacity limit', async () => {
      const poolChain = createMockChain([]);
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'exotel_pools') return poolChain;
        return createMockChain();
      });

      const poolId = await PoolService.assignToPool(12, '+919876522222');

      expect(poolId).toBeNull();
    });
  });

  describe('Routing Resolver Engine', () => {
    it('should resolve a call to the correct business using the Exotel number', async () => {
      const poolChain = createMockChain({ id: 101 });
      const phoneChain = createMockChain({ business_id: 55, original_number: '+919876511111' });
      const assistantChain = createMockChain({ id: 777 });
      const callSessionChain = createMockChain({});

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'exotel_pools') return poolChain;
        if (table === 'phone_numbers') return phoneChain;
        if (table === 'assistants') return assistantChain;
        if (table === 'call_sessions') return callSessionChain;
        return createMockChain();
      });

      const result = await RoutingService.routeCall('call-sid-123', '+919999999999', '+918080800001');

      expect(result).toEqual({ businessId: '55', assistantId: '777' });
      expect(poolChain.eq).toHaveBeenCalledWith('exotel_number', '+918080800001');
      expect(phoneChain.eq).toHaveBeenCalledWith('exotel_pool_id', 101);
      expect(assistantChain.eq).toHaveBeenCalledWith('business_id', 55);
      expect(callSessionChain.insert).toHaveBeenCalledWith({
        business_id: 55,
        call_sid: 'call-sid-123',
        caller_number: '+919999999999',
        original_number: '+919876511111',
        session_status: 'in-progress'
      });
      expect(redisClient.hmset).toHaveBeenCalledWith('call:call-sid-123', {
        business_id: '55',
        assistant_id: '777',
        caller_number: '+919999999999',
        original_number: '+919876511111',
        conversation_history: '[]',
        lead_data: '{}'
      });
      expect(redisClient.expire).toHaveBeenCalledWith('call:call-sid-123', 7200);
    });

    it('should return null if Exotel number is not registered in any pool', async () => {
      // Create a chain that rejects with an error for single() to simulate no rows found
      const poolChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
        then: jest.fn().mockImplementation((resolve: any) => resolve({ data: null, error: new Error('Not found') }))
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'exotel_pools') return poolChain;
        return createMockChain();
      });

      const result = await RoutingService.routeCall('call-sid-123', '+919999999999', '+918080800001');
      expect(result).toBeNull();
    });
  });

  describe('Webhook Controller Endpoints', () => {
    it('should successfully handle incoming call webhook via POST body', async () => {
      mockRequest.body = {
        CallSid: 'sid-1',
        From: '+919999999999',
        To: '+918080800001'
      };

      jest.spyOn(RoutingService, 'routeCall').mockResolvedValue({
        businessId: '55',
        assistantId: '777'
      });

      await WebhookController.handleIncomingCall(mockRequest as Request, mockResponse as Response);

      expect(RoutingService.routeCall).toHaveBeenCalledWith('sid-1', '+919999999999', '+918080800001');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Call routed successfully',
        businessId: '55',
        assistantId: '777',
        action: 'connect_to_sarvam_stream'
      });
    });

    it('should successfully handle incoming call webhook via GET query params', async () => {
      mockRequest.query = {
        CallSid: 'sid-2',
        From: '+919999999999',
        To: '+918080800002'
      };

      jest.spyOn(RoutingService, 'routeCall').mockResolvedValue({
        businessId: '60',
        assistantId: '800'
      });

      await WebhookController.handleIncomingCall(mockRequest as Request, mockResponse as Response);

      expect(RoutingService.routeCall).toHaveBeenCalledWith('sid-2', '+919999999999', '+918080800002');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Call routed successfully',
        businessId: '60',
        assistantId: '800',
        action: 'connect_to_sarvam_stream'
      });
    });

    it('should return 400 if required parameters are missing', async () => {
      mockRequest.body = {
        CallSid: 'sid-3'
      };

      await WebhookController.handleIncomingCall(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Missing required webhook parameters: CallSid, From, or To'
      });
    });

    it('should return 404 if business or assistant cannot be resolved', async () => {
      mockRequest.body = {
        CallSid: 'sid-4',
        From: '+919999999999',
        To: '+918080800004'
      };

      jest.spyOn(RoutingService, 'routeCall').mockResolvedValue(null);

      await WebhookController.handleIncomingCall(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Business or active assistant not found'
      });
    });

    it('should handle call end webhook by cleaning up and triggering lead extraction', async () => {
      mockRequest.body = { CallSid: 'sid-end' };

      const sessionsChain = createMockChain();
      const leadsChain = createMockChain();
      const notificationsChain = createMockChain();

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'call_sessions') return sessionsChain;
        if (table === 'leads') return leadsChain;
        if (table === 'notifications') return notificationsChain;
        return createMockChain();
      });

      (redisClient.hgetall as jest.Mock).mockResolvedValue({
        business_id: '55',
        caller_number: '+919999999999',
        conversation_history: '[]'
      });

      await WebhookController.handleCallEnd(mockRequest as Request, mockResponse as Response);

      expect(sessionsChain.update).toHaveBeenCalledWith(
        expect.objectContaining({ session_status: 'completed' })
      );
      expect(redisClient.del).toHaveBeenCalledWith('call:sid-end');
      expect(leadsChain.insert).toHaveBeenCalled();
      expect(notificationsChain.insert).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Call finalized successfully' });
    });
  });
});
