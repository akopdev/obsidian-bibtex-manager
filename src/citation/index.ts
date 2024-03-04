import { Entry } from "@retorquere/bibtex-parser/grammar";
import { Engine } from 'citeproc';
import { requestUrl, Notice, RequestUrlParam, htmlToMarkdown } from 'obsidian';

interface ICitation {
	"id": string,
	"type": string,
	"title"?: string,
	"URL"?: string,
	"DOI"?: string,
	"publisher"?: string,
	"published"?: string,
	"author"?: Array<IAuthor>,
	"issued"?: {
		"date-parts": [[number, number, number]],
	},
	"accessed"?: {
		"date-parts": [[number, number, number]],
	}
};

interface IAuthor {
	"given"?: string,
	"family"?: string
}

async function requestSafely(request: string | RequestUrlParam, rawUrl?: string) {
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

async function getLocale() {
	const result = await requestSafely('https://raw.githubusercontent.com/citation-style-language/locales/master/locales-en-US.xml');

	if (result === undefined) {
		return;
	}

	return result.text;
}

async function getStyle(style: string) {
	const result = await requestSafely('https://raw.githubusercontent.com/citation-style-language/styles/master/' + style + '.csl');

	if (result === undefined) {
		return;
	}

	return result.text;
}

export class Citation {
	citations: Array<ICitation>;
	citationIDs: Array<string>
	engine: any;
	style: string;
	locale: string;
	showAccessed: boolean;

	constructor(style: string, showAccessed: boolean) {
		this.style = style;
		this.showAccessed = showAccessed;

		this.citations = new Array();
		this.citationIDs = new Array();
	}

	async init() {
		const locale = await getLocale();

		if (locale === undefined) {
			return;
		}

		const sys = {
			retrieveLocale: (lang: string) => {
				return locale;
			},

			retrieveItem: (id: string) => {
				return this.citations[id];
			},
		};

		const style = await getStyle(this.style);

		if (style === undefined) {
			return;
		}

		this.engine = new Engine(sys, style);

		return true;
	}

	add(entry: Entry) {

		// @ts-ignore
		const citation: ICitation = { "id": entry.key, "type": entry.type }

		Object.keys(entry.fields).forEach((key) => {
			if (key === "year") {

				// TODO: check if entry contains month and transform it to date-parts
				citation["issued"] = {
					"date-parts": [[+entry.fields[key][0], 1, 1]]
				}
			} else {
				citation[key] = entry.fields[key][0]
			}
		});


		// @ts-ignore
		if (entry.creators?.author) {
			citation.author = new Array<IAuthor>();
			// @ts-ignore
			entry.creators.author.forEach(creator => {
				const author: IAuthor = {}
				if (creator.firstName) {
					author.given = creator.firstName;
				}

				if (creator.lastName) {
					author.family = creator.lastName;
				}
				citation.author.push(author);
			});
		}

		this.citations[citation.id] = citation;
		this.citationIDs.push(citation.id);

		return true;
	}

	get(id: string): string {
		if (this.engine === undefined || this.citations === undefined) {
			return "";
		}

		const cite = this.engine.previewCitationCluster({
			"citationID": id,
			"citationItems": [this.citations[id]],
			"properties": {
				"index": 0,
				"noteIndex": 1
			}
		}, [], [], "html");

		return htmlToMarkdown(cite);
	}

	bibliography(): string {
		if (this.engine === undefined || this.citations === undefined) {
			return "";
		}

		this.engine.updateItems(this.citationIDs);

		const bibliographyResult = this.engine.makeBibliography();
		const bibliography = Array<string>()
		bibliographyResult[1]?.forEach((entry: string) => {
			bibliography.push(htmlToMarkdown(entry) + "\n")
		});
		return bibliography.join("\n");
	}
}
