import * as https from 'node:https';

import Crawler from 'crawler';
import puppeteer, { Browser } from 'puppeteer';
import { JSDOM } from 'jsdom';

enum RequestMethod {
	GET = 'GET',
	PUT = 'PUT',
	DELETE = 'DELETE',
	POST = 'POST'
}

const _request = (method: RequestMethod, url: string, data?: Record<string, any>): Promise<string | void> =>
	new Promise((resolve, reject) => {
		const request = https.request(
			url,
			{
				method
			},
			response => {
				let responseBody = '';

				response.setEncoding('utf8');
				response.on('data', chunk => {
					responseBody += chunk;
				});
				response.on('end', () => {
					if (responseBody) {
						resolve(responseBody);
					} else {
						resolve();
					}
				});
			}
		);

		request.on('error', reject);

		// Write data to request body
		if (data) {
			request.write(JSON.stringify(data));
		}
		request.end();
	});

export const request = {
	post: (url: string, data?: Record<string, any>): Promise<string | void> =>
		_request(RequestMethod.POST, url, data),

	get: (url: string): Promise<string | void> =>
		_request(RequestMethod.GET, url),

	put: (url: string): Promise<string | void> =>
		_request(RequestMethod.PUT, url),

	delete: (url: string): Promise<string | void> =>
		_request(RequestMethod.DELETE, url),
} as const;

const getBrowser = (() => {
	let instance: Browser | null = null;

	return async (): Promise<Browser> => {
		if (instance) {
			return instance;
		}

		instance = await puppeteer.launch({
			headless: false,
			args: ['--disable-setuid-sandbox', '--disable-gpu'],
			'ignoreHTTPSErrors': true,
			dumpio: true
		});

		return instance;
	};
})();

export const sleep = (waitTimeMs: number) => new Promise(resolve => {
	setTimeout(resolve, waitTimeMs);
});

export const getPagePro = async (url: string): Promise<JSDOM> => {
	console.log(`Retrieving page: ${url}...`);
	const browser = await getBrowser();
	console.log('Got browser');
	const page = await browser.newPage();
	console.log('Got page!');

	await page.goto(url);

	const dom = new JSDOM(await page.content());

	await page.close();

	sleep(1000);
	
	console.log(`Page: ${url} retrieved!`);

	return dom;
};

export const closeBrowser = async () => {
	const browser = await getBrowser();

	return browser.close();
}


const crawler = new Crawler({
	maxConnections: 10,
	userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
});

export const getPage = (url: string, { headers }: {
	headers?: Record<string, any>
 } = {}): Promise<JSDOM> => {
	console.log(`Retrieving page: ${url}...`);
	return new Promise((resolve, reject) =>
		crawler.queue([
			{
				uri: url,
				headers,
				callback: (error, response, done) => {
					if (error) {
						done();
						return reject(error);
					}

					done();
					resolve(new JSDOM(response.body, {
						url
					}));
					console.log(`Page: ${url} retrieved!`);
				} 
			}
		])
	);
};

export const getPagePost = async (url: string, data: Record<string, any>) => {
	const response = (await request.post(url, data)) as string;

	return new JSDOM(response, { url });
}

export interface ArticleListing {
	text: string;
	url: string;
}

export interface Article {
	title: string;
	text: string;
	url: string;
}

export interface ArticleClassified extends Article {
	sentiment: string;
}
