import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { FileSuggest, CSLSuggest } from './suggest';
import { parse } from "@retorquere/bibtex-parser";
import { Entry } from "@retorquere/bibtex-parser/grammar";
import { CitationGenerator } from "./citation-generator"

interface BibTexManagerSettings {
	cslStyle: string,
	templateArticle: string,
	templateBook: string,
	templateBooklet: string,
	templateConference: string,
	templateInbook: string,
	templateIncollection: string,
	templateInproceedings: string,
	templateManual: string,
	templateMastersthesis: string,
	templateMisc: string,
	templatePhdthesis: string,
	templateProceedings: string,
	templateTechreport: string,
	templateUnpublished: string

}

const DEFAULT_SETTINGS: BibTexManagerSettings = {
	cslStyle: "apa-6th-edition",
	templateArticle: "",
	templateBook: "",
	templateBooklet: "",
	templateConference: "",
	templateInbook: "",
	templateIncollection: "",
	templateInproceedings: "",
	templateManual: "",
	templateMastersthesis: "",
	templateMisc: "",
	templatePhdthesis: "",
	templateProceedings: "",
	templateTechreport: "",
	templateUnpublished: ""
}

const BIBTEX_TYPES: Array<string> = [
	"Article",
	"Book",
	"Booklet",
	"Conference",
	"Inbook",
	"Incollection",
	"Inproceedings",
	"Manual",
	"Mastersthesis",
	"Misc",
	"Phdthesis",
	"Proceedings",
	"Techreport",
	"Unpublished"
]

export abstract class StringHelper {
	public static sanitizeKeyString(key: string): string {
		const allLowerCase = key.toLowerCase();
		return allLowerCase.charAt(0).toUpperCase() + allLowerCase.slice(1);
	}

	public static trim(str: string, trim: string): string {
		let start = 0;
		let end = str.length;

		while (start < end && str[start] === trim)
			++start;

		while (end > start && str[end - 1] === trim)
			--end;

		return (start > 0 || end < str.length) ? str.substring(start, end) : str;
	}
}
export default class BibTeXManager extends Plugin {
	settings: BibTexManagerSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'insert-bibtex',
			name: 'Insert',
			callback: () => {
				new InsertBibTexModal(this.app, this.settings).open();
			}
		});

		this.addSettingTab(new BibTeXManagerSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("bibtex", async (source: string, el, ctx) => {
			const codeBlock = el.createEl("div").createEl("pre").createEl("code");

			try {

				console.log(this.settings.cslStyle)
				const generator = new CitationGenerator(this.settings.cslStyle, false);
				await generator.createEngine();

				// @ts-ignore
				const text = parse(source)
				text.entries.forEach(async (entry: Entry) => {
					generator.addCitation(entry);
				})
				const bib = generator.getBibliography()
				codeBlock.createEl("span", { text: bib, cls: "bibtex key" });

			} catch (exception) {
				codeBlock.createEl("span", { text: "Invalid BibTeX format!", cls: "bibtex key" });
			}
		});

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class InsertBibTexModal extends Modal {
	bibtex: string;
	template: string;
	settings: BibTexManagerSettings;

	constructor(app: App, settings: BibTexManagerSettings) {
		super(app);
		this.settings = settings;
	}

	async getTemplate(entry: Entry): Promise<string> {
		const templateName = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
		let template = this.template ? this.settings["template" + this.template] : this.settings["template" + templateName];
		if (!template) {
			return "";
		}
		const templateFile = this.app.vault.getAbstractFileByPath(template);
		if (templateFile instanceof TFile) {
			return await this.app.vault.cachedRead(templateFile);
		}
		return "";
	}

	async onSubmit(text: string) {
		const viewer = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!viewer) {
			new Notice("No active editor");
			return;
		}
		try {
			const generator = new CitationGenerator(this.settings.cslStyle, false);

			// @ts-ignore
			parse(text).entries.forEach(async (entry: Entry) => {
				let file = await this.getTemplate(entry);
				if (file) {
					await generator.createEngine();
					// generate citation
					generator.addCitation(entry);

					const mapping = {
						"type": entry.type,
						"citekey": (<any>entry).key,
						"bibliography": generator.getBibliography(),
						"citation": generator.getCitation((<any>entry).key)
					}

					const fields = Object.assign(mapping, entry.fields);
					Object.keys(fields).forEach(key => {
						file = file.replace("{{" + key + "}}", fields[key]);
					})
					viewer.editor.replaceSelection(file + "\n");
				}
			})
		} catch (e) {
			console.error(e);
		}

		this.close();

	}

	async onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Insert BibTeX" });


		new Setting(contentEl)
			.addTextArea(text => {
				text.setPlaceholder('Paste the content of your BibTeX file')
					.onChange((value) => {
						this.bibtex = value
					});
				text.inputEl.addClass("bibtex-manager-template");
			}).setClass("bibtex-manager-template-container");

		new Setting(contentEl)
			.setName('Apply template')
			.addDropdown((cb) => {
				cb.addOption("", "Auto detect");
				BIBTEX_TYPES.forEach((type) =>
					cb.addOption(type, type));

				cb.onChange((value) => {
					this.template = value ? BIBTEX_TYPES[value] : "";
				});
			});


		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Cancel")
					.onClick(() => {
						this.close();
					});
			})
			.addButton((btn) =>
				btn
					.setButtonText("Insert")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.bibtex);
					}));

	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class BibTeXManagerSettingTab extends PluginSettingTab {
	plugin: BibTeXManager;

	constructor(app: App, plugin: BibTeXManager) {
		super(app, plugin);
		this.plugin = plugin;
		this.app = app;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();


		new Setting(this.containerEl)
			.setName("Citation style ID")
			.addSearch((cb) => {
				new CSLSuggest(this.app, cb.inputEl);
				cb.setPlaceholder("CSL Style: style-name")
					.setValue(this.plugin.settings.cslStyle)
					.onChange((style) => {
						this.plugin.settings.cslStyle = style
						this.plugin.saveSettings();

					});
				// @ts-ignore
				cb.containerEl.addClass("bibtex-manager-search");
			});

		containerEl.createEl('h2', { text: "Templates" });

		BIBTEX_TYPES.forEach((type) => {
			new Setting(containerEl)
				.setName(type)
				.addSearch((cb) => {
					new FileSuggest(this.app, cb.inputEl);
					cb.setValue(this.plugin.settings[`template${type}`])
						.onChange((folder) => {
							this.plugin.settings[`template${type}`] = folder;
							this.plugin.saveSettings();
						});
					// @ts-ignore
					cb.containerEl.addClass("bibtex-manager-search");
				});
		});
	}
}
