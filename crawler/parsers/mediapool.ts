import { getPage, getPagePost, ArticleListing, Article } from '../common';

const ONE_DAY_MS = 24 * 60 * 1000;

const getArticleListingFromNPages = async (pageCount: number): Promise<ArticleListing[]> => {
	const results: ArticleListing[] = [];

	const currentDate = new Date();

	for (let i = 0; i < pageCount; i++) {
		const dateToFetch = new Date(currentDate.getTime() - ONE_DAY_MS * i);

		const document = (await getPagePost('https://www.mediapool.bg/voina-v-ukraina-cat90.html', {
			rdate: `${dateToFetch.getFullYear()}-${dateToFetch.getMonth() + 1}-${dateToFetch.getDate()}`
		})).window.document;

		const hrefs = Array.from(document.querySelectorAll('.c-article-item')).map(item => item.getAttribute('href'));
		const titles = Array.from(document.querySelectorAll('.c-article-item__title')).map(item => item.textContent);

		for (let i = 0; i < hrefs.length; i++) {
			results.push({
				text: titles[i] ?? '',
				url: hrefs[i] ?? ''
			});
		}
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
	document.querySelector('.httpoolad')?.remove();

	const newsArticle = document.querySelector('.c-article-content')?.textContent ?? '';

	return {
		title: listing.text,
		url: listing.url,
		text: newsArticle.trim()
	};
};

export const MediapoolParser = async (): Promise<Article[]> => {
	const articleListings = await getArticleListingFromNPages(10);

	const articles: Promise<Article>[] = [];

	for (const articleListing of articleListings) {
		articles.push(getArticleFromListing(articleListing));
	}

	return (await Promise.all(articles)).filter(article => article.text !== '');
}
