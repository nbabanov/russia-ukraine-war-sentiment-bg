import * as fs from 'fs';
import * as path from 'path';

import { Article, ArticleClassified } from './common';

const RAW_DATA_PATH = '../data';
const CLASSIFIED_PATH = '../data-classified';

enum Sentiment {
	PRO_WEST = 'pro-west',
	PRO_RUSSIAN = 'pro-russian'
}

const classify = (entryList: string[], sentiment: Sentiment) => {
	for (const entry of entryList) {
		const data = JSON.parse(fs.readFileSync(path.join(RAW_DATA_PATH, entry), 'utf-8'))
			.map((article: ArticleClassified) => {
				article.sentiment = sentiment;

				return article;
			});
	
		const entryName = entry.split('Parser.json')[0] + 'DataSorted.json';
	
		fs.writeFileSync(path.join(CLASSIFIED_PATH, entryName), JSON.stringify(data, null, '\t'));
	}
}

const proRussian = [
	'BlitzParser.json',
	'EpicentarParser.json',
	'FaktiParser.json',
	'IstinataParser.json',
	'PogledInfoParser.json',
	'VchasParser.json',
];

const proWest = [
	'MediapoolParser.json',
	'DnevnikParser.json',
	'SvobodnaEvropaParser.json',
];

const merge = () => {
	const fileNames = fs.readdirSync(CLASSIFIED_PATH);

	const data = fileNames.reduce((accumolator: ArticleClassified[], fileName: string) => {
		const fileData = JSON.parse(fs.readFileSync(path.join(CLASSIFIED_PATH, fileName), 'utf-8')) as ArticleClassified[];

		accumolator = accumolator.concat(fileData);
		return accumolator;
	}, []);

	console.log(`articles: ${data.length}`);

	fs.writeFileSync('../data-merged.json', JSON.stringify(data, null, '\t'));
}


classify(proRussian, Sentiment.PRO_RUSSIAN);
classify(proWest, Sentiment.PRO_WEST);
merge();
