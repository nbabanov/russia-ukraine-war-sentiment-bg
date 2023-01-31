import { getPagePro, ArticleListing, Article } from '../common';

const getArticleListingFromNPages = async (pageCount: number): Promise<ArticleListing[]> => {
	const results: ArticleListing[] = [];

	for (let i = 1; i <= pageCount; i++) {
		const dom = await getPagePro(`https://fakti.bg/search?q=%D1%83%D0%BA%D1%80%D0%B0%D0%B9%D0%BD%D0%B0&page=${i}`);

		results.push(...Array.from(dom.window.document.querySelectorAll('.list-title')).map(item => ({
			text: item.textContent ?? '',
			url: 'https://fakti.bg' + item.getAttribute('href') ?? ''
		})));
	}

	return results;
}

const getArticleFromListing = async (listing: ArticleListing): Promise<Article> => {
	const document = (await getPagePro(listing.url)).window.document;
	document.querySelectorAll('iframe').forEach(element => element.remove());
	document.querySelectorAll('.rateDiv').forEach(element => element.remove());
	document.querySelectorAll('script').forEach(element => element.remove());
	document.querySelectorAll('style').forEach(element => element.remove());
	document.querySelectorAll('video').forEach(element => element.remove());

	const newsArticle = document.querySelector('.news-text')?.textContent ?? '';

	return {
		title: listing.text.trim(),
		url: listing.url,
		text: newsArticle
			.replace(/\n\n\n     \(adsbygoogle = window.adsbygoogle \|\| \[\]\)\.push\({}\);/g, '')
			.replace(/\(sc_adv_out = window\.sc_adv_out \|\| \[\]\)\.push\((.|\r|\n)*\);/g, '')
			.replace(/var(.|\r|\n)*}/g, '')
			.replace('Намери ни във facebook ', '')
			// .replace(/\d*\.\d*\.\d*(\n|\r)*\s*[a-zA-Zа-яА-Я]*\s*(\n|\r)\s*\d*((\n|\r)\s*)*/g, '')
			.replace(/loading.../g, '')
			.replace(/facebook|twitter/gi, '')
			.trim()
	};
};

export const FaktiParser = async (): Promise<Article[]> => {
	const articleListings = await getArticleListingFromNPages(10);

	const articles: Article[] = [];

	const chunkSize = 5;

	for (let i = 0; i < articleListings.length; i += chunkSize) {
		console.log(i);
		const slice = articleListings.slice(i, i + chunkSize);
		articles.push(...(await Promise.all(slice.map(item => getArticleFromListing(item)))));
	}

	return articles.filter(article => article.text !== '');
}
