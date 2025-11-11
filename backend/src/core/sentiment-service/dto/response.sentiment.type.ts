export type SentimentResponseType = {
	review_data: {
		text_original: string;
		text_processed: string;
	};
	sentiment_analysis: {
		label: 'POS' | 'NEG' | 'NEU' | string;
		score_1_to_5: number;
		probabilities: {
			positive: number; // e.g. 67.31 (percent)
			negative: number; // e.g. 2.59
			neutral: number;  // e.g. 30.1
		};
	};
	summary: {
		puntuacion_estrellas: string; // e.g. "4/5 ⭐"
		polaridad_completa: {
			POS: string; // e.g. "Positiva"
			NEG: string; // e.g. "No Negativa"
			NEU: string; // e.g. "No Neutral"
		};
	};
};
