import { getPage, ArticleListing, Article } from '../common';

const getArticleListingFromNPages = async (pageCount: number): Promise<ArticleListing[]> => {
	const results: ArticleListing[] = [];

	for (let i = 1; i <= pageCount; i++) {
		const document = (await getPage(`https://epicenter.bg/search/%D1%83%D0%BA%D1%80%D0%B0%D0%B9%D0%BD%D0%B0/${i}`)).window.document;

		Array.from(document.querySelectorAll('.desc_top_large')).forEach(item => item.remove());

		const hrefs = Array.from(document.querySelectorAll('.products_list > [href]')).map(item => item.getAttribute('href'));
		const titles = Array.from(document.querySelectorAll('.products_list h2')).map(item => item.textContent);

		for (let i = 0; i < hrefs.length; i++) {
			results.push({
				text: titles[i] ?? '',
				url: 'https://epicenter.bg' + hrefs[i] ?? ''
			})
		}
	}

	return results;
}

const getArticleFromListing = async (listing: ArticleListing): Promise<Article> => {
	const document = (await getPage(listing.url)).window.document;
	document.querySelectorAll('script').forEach(element => element.remove());
	document.querySelectorAll('style').forEach(element => element.remove());
	Array.from(document.querySelectorAll('p')).filter(item => item.innerHTML?.includes('<img')).forEach(item => item.remove());
	document.querySelectorAll('video').forEach(element => element.remove());

	const newsArticle = document.querySelector('[itemprop="articleBody"]')?.textContent ?? '';

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
			.replace('Последвайте Епицентър.БГ вече и в Телеграм и Туитър!', '')
			.replace(/facebook|twitter/gi, '')
			.trim()
	};
};

export const EpicentarParser = async (): Promise<Article[]> => {
	const articleListings = await getArticleListingFromNPages(10);

	const articles: Promise<Article>[] = [];

	for (const articleListing of articleListings) {
		articles.push(getArticleFromListing(articleListing));
	}

	return (await Promise.all(articles)).filter(article => article.text !== '');
}
