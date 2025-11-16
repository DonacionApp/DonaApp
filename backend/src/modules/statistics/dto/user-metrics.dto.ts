export class KeyValue {
  name: string;
  value: number;
}

export class ArticleStat {
  articleId: number;
  name: string;
  quantity: number;
}

export class UserMetricsDto {
  userId: number;
  totals: {
    totalPosts: number;
    totalDonationsAsOwner: number;
    totalDonationsAsDonator: number;
    totalLikes: number;
    chatsCount: number;
  };
  donationsByStatus: KeyValue[]; // para charts: [{name: status, value: count}]
  donationsAsDonatorByStatus: KeyValue[];
  donatedArticles: ArticleStat[]; // artículos que el usuario donó
  receivedArticles: ArticleStat[]; // artículos que recibieron sus posts
}
