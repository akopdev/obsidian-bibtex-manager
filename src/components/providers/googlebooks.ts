import { requestUrl, RequestUrlResponse } from "obsidian";
import { BibTexProvider } from "./base";

export class GoogleBooksProvider implements BibTexProvider {

	private isbn: string | null = null;

	constructor(private input: string) {
		this.isbn = input.replace(/[-\s]/g, '');
	}

	match(): boolean {
		return /^[0-9]{9}[0-9X]$|^[0-9]{13}$/.test(this.isbn);
	}

	async fetch(): Promise<string> {
		if (!this.isbn) {
			return;
		}
		try {
			const response: RequestUrlResponse = await requestUrl({
				url: `https://www.googleapis.com/books/v1/volumes?q=isbn:${this.isbn}`,
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					"Accept": "application/json"
				}
			});

			if (response.status != 200) {
				throw new Error(`Failed to fetch data from Google Books: ${response}`)
			}

			const data = response.json;

			if (!data.items || data.items.length === 0) {
				throw new Error(`No books found with ISBN: ${this.isbn}`);
			}

			const info = data.items[0].volumeInfo;

			const author = (info.authors || []).join(" and ");
			const year = (info.publishedDate || "").slice(0, 4);
			const isbnEntry = info.industryIdentifiers?.find((id: any) => id.type === "ISBN_13");
			const key = `${author.split(" ")[0].toLowerCase()}${year}${info.title.split(" ")[0].toLowerCase()}`;

			return [
				`@book{${key},`,
				`  title = {${info.title}},`,
				`  author = {${author}},`,
				`  year = {${year}},`,
				`  publisher = {${info.publisher}},`,
				`  url = {${info.previewLink}},`,
				`  isbn = {${isbnEntry?.identifier || ""}}`,
				`}`
			].join('\n');

		} catch (error) {
			throw error;
		}
	}
}
