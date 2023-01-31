import { getPage, ArticleListing, Article } from '../common';

const getArticleListingFromNPages = async (pageCount: number): Promise<ArticleListing[]> => {
	const results: ArticleListing[] = [];

	for (let i = 1; i <= pageCount; i++) {

		const document = (await getPage(`https://www.svobodnaevropa.bg/s?k=%D1%83%D0%BA%D1%80%D0%B0%D0%B9%D0%BD%D0%B0&tab=all&pi=${i}&r=any&pp=20`)).window.document;

		results.push(...Array.from(document.querySelectorAll('.media-block__content--h [href][onclick]')).map(item => ({
			text: item.getAttribute('title') ?? '',
			url: 'https://www.svobodnaevropa.bg' + item.getAttribute('href') ?? ''
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

	document.querySelectorAll('.also-read').forEach(element => element.remove());
	document.querySelectorAll('.wsw__embed').forEach(element => element.remove());

	const newsArticle = document.querySelector('.wsw')?.textContent ?? '';

	return {
		title: listing.text,
		url: listing.url,
		text: newsArticle.trim()
	};
};

export const SvobodnaEvropaParser = async (): Promise<Article[]> => {
	const articleListings = await getArticleListingFromNPages(10);

	const articles: Promise<Article>[] = [];

	for (const articleListing of articleListings) {
		articles.push(getArticleFromListing(articleListing));
	}

	return (await Promise.all(articles)).filter(article => article.text !== '');
}
