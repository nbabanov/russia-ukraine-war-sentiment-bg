import { getPage, ArticleListing, Article } from '../common';

const getArticleListingFromNPages = async (pageCount: number): Promise<ArticleListing[]> => {
	const results: ArticleListing[] = [];

	for (let i = 1; i <= pageCount; i++) {
		const dom = await getPage(`https://pogled.info/search/${i}?q=%D1%83%D0%BA%D1%80%D0%B0%D0%B9%D0%BD%D0%B0`);

		results.push(...Array.from(dom.window.document.querySelectorAll('h2 > a[itemprop="url"]')).map(item => ({
			text: item.textContent ?? '',
			url: item.getAttribute('href') ?? ''
		})));
	}

	return results;
}

const getArticleFromListing = async (listing: ArticleListing): Promise<Article> => {
	const document = (await getPage(listing.url)).window.document;
	const newsArticle = document.querySelector('.post-content');
	
	return {
		title: listing.text,
		url: listing.url,
		text: (newsArticle?.textContent ?? '').replace(/Абонирайте(.|\r|\n)*/g, '').replace('/Поглед.инфо/', '').trim()
	};
};

export const PogledInfoParser = async (): Promise<Article[]> => {
	const articleListings = await getArticleListingFromNPages(10);

	const articles: Promise<Article>[] = [];

	for (const articleListing of articleListings) {
		articles.push(getArticleFromListing(articleListing));
	}

	return Promise.all(articles);
}
