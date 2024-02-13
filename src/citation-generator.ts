import { Entry } from '@retorquere/bibtex-parser';
import { Engine } from 'citeproc';
import { getLocale, getStyle, Author, Citation } from './helpers';
import { htmlToMarkdown } from 'obsidian';

export class CitationGenerator {
	citations: Array<Citation>;
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

	async createEngine() {
		const locale = await getLocale();

		if (locale === undefined) {
			return;
		}

		const sys = {
			retrieveLocale: (lang: string) => {
				return locale;
			},

			retrieveItem: (id: number) => {
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

	addCitation(entry: Entry) {

		const citation: Citation = { "id": entry.key, "type": entry.type }

		Object.keys(entry.fields).forEach((key) => {
			if (key === "year") {
				citation["issued"] = {
					"date-parts": [[entry.fields[key].pop(), 1, 1]]
				}
			} else {
				citation[key] = entry.fields[key].pop()
			}
		});

		if (entry.creators.author) {
			citation.author = new Array();
			entry.creators.author.forEach(creator => {
				const author: Author = {}
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

	getBibliography(): string {
		if (this.engine === undefined || this.citations === undefined) {
			return "";
		}

		this.engine.updateItems(this.citationIDs);

		const bibliographyResult = this.engine.makeBibliography();
		if (bibliographyResult[1]) {
			return htmlToMarkdown(bibliographyResult[1][0])
		}
		return "";
	}
}
