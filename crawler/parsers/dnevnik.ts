import { getPage, ArticleListing, Article } from '../common';

const listingHeaders = {
	'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
	'sec-ch-ua': `"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"`,
	'referer': 'https://www.dnevnik.bg/temi/voinata_v_evropa/',
	'X-Requested-With': 'XMLHttpRequest'
}

const getArticleListingFromNPages = async (pageCount: number): Promise<ArticleListing[]> => {
	const results: ArticleListing[] = [];

	for (let i = 0; i < pageCount; i++) {

		const document = (await getPage(`https://www.dnevnik.bg/ajax/section/temi/voinata_v_evropa/${30 * i}/0`, {
			headers: listingHeaders
		})).window.document;

		results.push(...Array.from(document.querySelectorAll('.topic-feed > [href]')).map(item => ({
			text: item.getAttribute('title') ?? '',
			url: 'https://www.dnevnik.bg' + item.getAttribute('href') ?? ''
		})));
	}

	return results;
}

const getArticleFromListing = async (listing: ArticleListing): Promise<Article> => {
	const document = (await getPage(listing.url)).window.document;
	document.querySelectorAll('script').forEach(element => element.remove());
	document.querySelectorAll('style').forEach(element => element.remove());
	document.querySelectorAll('iframe').forEach(element => element.remove());
	Array.from(document.querySelectorAll('p')).filter(item => item.innerHTML?.includes('<img')).forEach(item => item.remove());
	document.querySelectorAll('video').forEach(element => element.remove());

	document.querySelectorAll('figure').forEach(element => element.remove());
	document.querySelectorAll('.banner-box').forEach(element => element.remove());
	document.querySelectorAll('.article-related').forEach(element => element.remove());
	document.querySelectorAll('#AllimportantToKnow').forEach(element => element.remove());

	const newsArticle = document.querySelector('.article-content')?.textContent ?? '';

	return {
		title: listing.text,
		url: listing.url,
		text: newsArticle.trim()
	};
};

export const DnevnikParser = async (): Promise<Article[]> => {
	const articleListings = await getArticleListingFromNPages(10);

	const articles: Promise<Article>[] = [];

	for (const articleListing of articleListings) {
		articles.push(getArticleFromListing(articleListing));
	}

	return (await Promise.all(articles)).filter(article => article.text !== '');
}
