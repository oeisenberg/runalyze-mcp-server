import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RunalyzeStatisticsTool } from '../runalyze-statistics.tool';

describe('RunalyzeStatisticsTool', () => {
  let tool: RunalyzeStatisticsTool;
  let mockContext: any;
  let mockFetch: jest.SpyInstance;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          'runalyze.apiToken': 'test-token',
          'runalyze.baseUrl': 'https://runalyze.com',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunalyzeStatisticsTool,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    tool = module.get<RunalyzeStatisticsTool>(RunalyzeStatisticsTool);

    mockContext = {
      reportProgress: jest.fn().mockResolvedValue(undefined),
    };

    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    mockFetch.mockRestore();
  });

  it('should be defined', () => {
    expect(tool).toBeDefined();
  });

  describe('getCurrentStatistics', () => {
    it('should successfully return current statistics', async () => {
      const mockData = {
        effectiveVO2max: 55.1,
        effectiveVO2maxProgress: 50,
        fitness: 10,
        fatigue: 20,
        performance: -10,
        fitnessMaximum: 100,
        fatigueMaximum: 50,
        fitnessInPercent: 40,
        fatigueInPercent: 35,
        performanceInPercent: -10,
        acuteChronicWorkloadRatio: 1.05,
        acuteChronicWorkloadRatioMax: 2,
        acuteChronicWorkloadRatioOptimumRange: [0.8, 1.3],
        easyTrimp: 25,
        easyTrimpLower: 15,
        easyTrimpUpper: 45,
        easyTrimpRangeFrom: 3,
        easyTrimpRangeTo: 9,
        restDays: 2.5,
        restDaysPercent: 35.7,
        marathonShape: 70,
        marathonShapePercent: 70,
        hrvBaseline: 85,
        hrvNormalRange: [80, 90],
        monotonyValue: 65,
        monotonyPercent: 65,
        trainingStrain: 420,
        trainingStrainPercent: 55,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      const result = await tool.getCurrentStatistics({}, mockContext);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('https://runalyze.com/api/v1/statistics/current', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          token: 'test-token',
        },
      });
      expect(mockContext.reportProgress).toHaveBeenCalledTimes(4);
    });

    it('should handle 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const result = await tool.getCurrentStatistics({}, mockContext);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('Unauthorized');
      expect(parsed.status).toBe(401);
      expect(parsed.message).toContain('Invalid Runalyze API token');
    });

    it('should handle 403 Forbidden', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as Response);

      const result = await tool.getCurrentStatistics({}, mockContext);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('Forbidden');
      expect(parsed.status).toBe(403);
      expect(parsed.message).toContain('Access denied');
    });

    it('should handle other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await tool.getCurrentStatistics({}, mockContext);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('API Error');
      expect(parsed.status).toBe(500);
      expect(parsed.message).toContain('Request failed with status 500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await tool.getCurrentStatistics({}, mockContext);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('Request Failed');
      expect(parsed.message).toBe('Network error');
      expect(mockContext.reportProgress).toHaveBeenLastCalledWith({
        progress: 100,
        total: 100,
      });
    });

    it('should report progress at intervals', async () => {
      const mockData = {
        effectiveVO2max: 55.1,
        effectiveVO2maxProgress: 50,
        fitness: 10,
        fatigue: 20,
        performance: -10,
        fitnessMaximum: 100,
        fatigueMaximum: 50,
        fitnessInPercent: 40,
        fatigueInPercent: 35,
        performanceInPercent: -10,
        acuteChronicWorkloadRatio: 1.05,
        acuteChronicWorkloadRatioMax: 2,
        acuteChronicWorkloadRatioOptimumRange: [0.8, 1.3],
        easyTrimp: 25,
        easyTrimpLower: 15,
        easyTrimpUpper: 45,
        easyTrimpRangeFrom: 3,
        easyTrimpRangeTo: 9,
        restDays: 2.5,
        restDaysPercent: 35.7,
        marathonShape: 70,
        marathonShapePercent: 70,
        hrvBaseline: 85,
        hrvNormalRange: [80, 90],
        monotonyValue: 65,
        monotonyPercent: 65,
        trainingStrain: 420,
        trainingStrainPercent: 55,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      } as Response);

      await tool.getCurrentStatistics({}, mockContext);

      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(1, {
        progress: 0,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(2, {
        progress: 25,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(3, {
        progress: 75,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(4, {
        progress: 100,
        total: 100,
      });
    });

    it('should return error when API token is not configured', async () => {
      const mockConfigServiceNoToken = {
        get: jest.fn((key: string) => {
          const config: Record<string, string> = {
            'runalyze.apiToken': '',
            'runalyze.baseUrl': 'https://runalyze.com',
          };
          return config[key];
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RunalyzeStatisticsTool,
          {
            provide: ConfigService,
            useValue: mockConfigServiceNoToken,
          },
        ],
      }).compile();

      const toolNoToken = module.get<RunalyzeStatisticsTool>(RunalyzeStatisticsTool);
      const result = await toolNoToken.getCurrentStatistics({}, mockContext);
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('Authentication Required');
      expect(parsed.message).toContain('No Runalyze API token provided');
      expect(parsed.instructions).toBeDefined();
    });
  });
});
