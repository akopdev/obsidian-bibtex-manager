import { parse } from "@retorquere/bibtex-parser";
import { Entry } from "@retorquere/bibtex-parser/grammar";
import { Citation } from "./modules";
import {
	SettingTab,
	Settings,
	Core,
	CreateModal,
	InsertModal,
} from "./components";

export default class BibTeXManager extends Core {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "insert-bibtex",
			name: "Insert",
			callback: () => {
				new InsertModal(this.app, this.settings).open();
			},
		});

		this.addCommand({
			id: "create-bibtex",
			name: "Create",
			callback: () => {
				new CreateModal(this.app, this.settings).open();
			},
		});

		this.addSettingTab(new SettingTab(this.app, this));

		if (this.settings.enableBibtexFormatting) {
			this.registerMarkdownCodeBlockProcessor(
				"bibtex",
				async (source: string, el, ctx) => {
					const codeBlock = el
						.createEl("div")
						.createEl("pre")
						.createEl("code");

					try {
						const citation = new Citation(
							this.settings.cslStyle,
							false,
						);

						await citation.init();

						const text = parse(source);
						// @ts-ignore
						text.entries.forEach(async (entry: Entry) => {
							citation.add(entry);
						});
						const bib = citation.all();
						codeBlock.createEl("span", {
							text: bib,
							cls: "bibtex key",
						});
					} catch (exception) {
						codeBlock.createEl("span", {
							text: "Invalid BibTeX format!",
							cls: "bibtex key",
						});
					}
				},
			);
		}
	}
}
