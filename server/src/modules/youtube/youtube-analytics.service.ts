import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

export interface YouTubeMonthlyAnalyticsResponse {
  month: string;
  estimatedRevenue: number;
  views: number;
  estimatedMinutesWatched: number;
}

@Injectable()
export class YouTubeAnalyticsService {
  async fetchMonthlyRevenue(
    accessToken: string,
    year: number,
  ): Promise<YouTubeMonthlyAnalyticsResponse[]> {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const analytics = google.youtubeAnalytics({ version: 'v2', auth });

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const response = await analytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      dimensions: 'month',
      metrics: 'estimatedRevenue,views,estimatedMinutesWatched',
      sort: 'month',
    });

    const rows = response.data.rows ?? [];

    return rows.map((row) => ({
      month: String(row[0]),
      estimatedRevenue: Number(row[1]) || 0,
      views: Number(row[2]) || 0,
      estimatedMinutesWatched: Number(row[3]) || 0,
    }));
  }
}
