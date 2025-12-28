export interface Analytics {
  totalQueries: number;
  activeUsers: number;
  totalUsers: number;
  totalConversations: number;
  totalKnowledgeBaseFiles: number;
  dailyQueries: DailyQuery[];
}

export interface DailyQuery {
  date: string;
  count: number;
}

export interface MetricCard {
  title: string;
  value: number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}