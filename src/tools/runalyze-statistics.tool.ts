import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { BaseRunalyzeTool } from './base-runalyze.tool';

const getCurrentStatisticsSchema = z.object({});

interface CurrentStatisticsResponse {
  effectiveVO2max: number;
  effectiveVO2maxProgress: number;
  fitness: number;
  fatigue: number;
  performance: number;
  fitnessMaximum: number;
  fatigueMaximum: number;
  fitnessInPercent: number;
  fatigueInPercent: number;
  performanceInPercent: number;
  acuteChronicWorkloadRatio: number;
  acuteChronicWorkloadRatioMax: number;
  acuteChronicWorkloadRatioOptimumRange: [number, number];
  easyTrimp: number;
  easyTrimpLower: number;
  easyTrimpUpper: number;
  easyTrimpRangeFrom: number;
  easyTrimpRangeTo: number;
  restDays: number;
  restDaysPercent: number;
  marathonShape: number;
  marathonShapePercent: number;
  hrvBaseline: number;
  hrvNormalRange: [number, number];
  monotonyValue: number;
  monotonyPercent: number;
  trainingStrain: number;
  trainingStrainPercent: number;
}

@Injectable()
export class RunalyzeStatisticsTool extends BaseRunalyzeTool {
  @Tool({
    name: 'get-runalyze-current-statistics',
    description:
      'Retrieve current performance statistics from the Runalyze API. Returns effective vo2max, fitness, fatigue, performance, acute/chronic ratio, monotony, training strain, and related metrics.',
    parameters: getCurrentStatisticsSchema,
  })
  async getCurrentStatistics(
    params: z.infer<typeof getCurrentStatisticsSchema>,
    context: Context,
    httpRequest?: any,
  ): Promise<string> {
    await context.reportProgress({ progress: 0, total: 100 });

    try {
      const endpoint = '/api/v1/statistics/current';

      await context.reportProgress({ progress: 25, total: 100 });

      const response = await this.fetchRunalyze(
        endpoint,
        context,
        {
          method: 'GET',
        },
        httpRequest,
      );

      await context.reportProgress({ progress: 75, total: 100 });

      const errorResponse = await this.handleHttpError(response);
      if (errorResponse) {
        return errorResponse;
      }

      const data = (await response.json()) as CurrentStatisticsResponse;

      await context.reportProgress({ progress: 100, total: 100 });

      return JSON.stringify(data, null, 2);
    } catch (error) {
      await context.reportProgress({ progress: 100, total: 100 });
      return this.formatErrorResponse(error);
    }
  }
}
