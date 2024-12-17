import { requestUrl, RequestUrlResponse } from "obsidian";
import { BibTexProvider } from "./base";

export class ArXivProvider implements BibTexProvider {

	id: string | null = null;

	constructor(private url: string) {
		this.url = url;
	}

	match(): boolean {
		const id = this.url.match(/\s*(?:arXiv:\s*|arxiv\.org\/\s*(?:abs|pdf)\s*\/)\s*(\d{4}\.\d{5})\s*/i)
		this.id = id ? id[1] : null;
		return !!this.id;
	}

	async fetch() {
		if (!this.match()) {
			return;
		}
		try {
			const response: RequestUrlResponse = await requestUrl({
				url: `https://arxiv.org/bibtex/${this.id}`
			});
			if (response.status === 200) {
				return response.text
			} else {
				throw new Error(`Failed to fetch data. Status: ${response.status}`);
			}
		} catch (error) {
			throw error;
		}

	}
}
