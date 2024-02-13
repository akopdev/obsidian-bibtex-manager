import { requestUrl, Notice, RequestUrlParam, htmlToMarkdown } from "obsidian";

export interface Citation {
	"id": string,
	"type": string,
	"title"?: string,
	"URL"?: string,
	"DOI"?: string,
	"publisher"?: string,
	"published"?: string,
	"author"?: Array<Author>,
	"issued"?: {
		"date-parts": [[number, number, number]],
	},
	"accessed"?: {
		"date-parts": [[number, number, number]],
	}
};

export interface Author {
	"given"?: string,
	"family"?: string
}

export async function requestSafely(request: string | RequestUrlParam, rawUrl?: string) {
	try {
		return await requestUrl(request);
	}
	catch {
		if (rawUrl) {
			new Notice("Error: Could not connect to " + rawUrl);
		}

		return;
	}
}

export async function getLocale() {
	const result = await requestSafely('https://raw.githubusercontent.com/citation-style-language/locales/master/locales-en-US.xml');

	if (result === undefined) {
		return;
	}

	return result.text;
}

export async function getStyle(style: string) {
	const result = await requestSafely('https://raw.githubusercontent.com/citation-style-language/styles/master/' + style + '.csl');

	if (result === undefined) {
		return;
	}

	return result.text;
}
