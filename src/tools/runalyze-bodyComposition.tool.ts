import { Injectable } from '@nestjs/common';
import { Tool, Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { BaseRunalyzeTool } from './base-runalyze.tool';

const getBodyCompositionSchema = z.object({
  page: z.number().int().min(1).default(1).describe('The collection page number (default: 1)'),
  itemsPerPage: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe('Number of items per page (default: 1)'),
});

interface BodyCompositionItem {
  id: number;
  date_time: string;
  weight: string;
  fat_percentage: number;
  water_percentage: number;
  muscle_percentage: number;
  bone_percentage: number;
}

interface BodyCompositionResponse {
  data: BodyCompositionItem[];
  page: number;
  totalItems?: number;
}

@Injectable()
export class RunalyzeBodyCompositionTool extends BaseRunalyzeTool {
  @Tool({
    name: 'get-runalyze-body-composition-data',
    description:
      'Retrieve Body Composition data from the Runalyze API. Returns a collection of body composition measurements including weight, fat percentage, water percentage, muscle percentage, and bone percentage along with date/time of measurement.',
    parameters: getBodyCompositionSchema,
  })
  async getSleepData(
    params: z.infer<typeof getBodyCompositionSchema>,
    context: Context,
    httpRequest?: any,
  ): Promise<string> {
    await context.reportProgress({ progress: 0, total: 100 });

    try {
      const { page, itemsPerPage } = params;
      const endpoint = `/api/v1/metrics/bodyComposition?page=${page}&itemsPerPage=${itemsPerPage}`;

      await context.reportProgress({ progress: 25, total: 100 });

      // Make the API request using base class method
      const response = await this.fetchRunalyze(
        endpoint,
        context,
        {
          method: 'GET',
        },
        httpRequest,
      );

      await context.reportProgress({ progress: 75, total: 100 });

      // Check for HTTP errors
      const errorResponse = await this.handleHttpError(response);
      if (errorResponse) {
        return errorResponse;
      }

      const data = (await response.json()) as BodyCompositionItem[];

      await context.reportProgress({ progress: 100, total: 100 });

      const result: BodyCompositionResponse = {
        data,
        page,
        totalItems: data.length,
      };

      return JSON.stringify(result, null, 2);
    } catch (error) {
      await context.reportProgress({ progress: 100, total: 100 });
      return this.formatErrorResponse(error);
    }
  }
}
