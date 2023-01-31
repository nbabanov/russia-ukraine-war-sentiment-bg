import { getPage, ArticleListing, Article } from '../common';

const getArticleListingFromNPages = async (pageCount: number): Promise<ArticleListing[]> => {
	const results: ArticleListing[] = [];

	for (let i = 1; i <= pageCount; i++) {
		const dom = await getPage(`https://vchas.net/page/${i}/?s=%D1%83%D0%BA%D1%80%D0%B0%D0%B9%D0%BD%D0%B0`);

		results.push(...Array.from(dom.window.document.querySelectorAll('.tab_all h3 > [href]')).map(item => ({
			text: item.textContent ?? '',
			url: item.getAttribute('href') ?? ''
		})));
	}

	return results;
}

const getArticleFromListing = async (listing: ArticleListing): Promise<Article> => {
	const document = (await getPage(listing.url)).window.document;
	document.querySelectorAll('.essb_links').forEach(element => element.remove());
	document.querySelectorAll('iframe').forEach(element => element.remove());
	document.querySelectorAll('#post-tags').forEach(element => element.remove());
	document.querySelectorAll('.post-info').forEach(element => element.remove());
	document.querySelectorAll('script').forEach(element => element.remove());
	document.querySelectorAll('style').forEach(element => element.remove());
	Array.from(document.querySelectorAll('p')).filter(item => item.innerHTML?.includes('<img')).forEach(item => item.remove());
	document.querySelectorAll('video').forEach(element => element.remove());

	const newsArticle = Array.from(document.querySelectorAll('.post_content p')).map(item => item.textContent).join('\n');

	return {
		title: listing.text,
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

export const VchasParser = async (): Promise<Article[]> => {
	const articleListings = await getArticleListingFromNPages(10);

	const articles: Promise<Article>[] = [];

	for (const articleListing of articleListings) {
		articles.push(getArticleFromListing(articleListing));
	}

	return (await Promise.all(articles)).filter(article => article.text !== '');
}
