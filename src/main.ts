import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { FileSuggest } from './suggest/FolderSuggester';
import { parse } from "@retorquere/bibtex-parser";
import { Entry } from "@retorquere/bibtex-parser/grammar";
import { CitationGenerator } from "./citation-generator"

interface BibTeXManagerSettings {
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

const DEFAULT_SETTINGS: BibTeXManagerSettings = {
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

export default class BibTeXManager extends Plugin {
	settings: BibTeXManagerSettings;

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
	settings: BibTeXManagerSettings;

	constructor(app: App, settings: BibTeXManagerSettings) {
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
			const generator = new CitationGenerator("apa", false);

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

		contentEl.createEl("h1", { text: "Bibliography" });


		new Setting(contentEl)
			.setName('Template')
			.addDropdown((cb) => {
				cb.addOption("", "Auto");
				BIBTEX_TYPES.forEach((type) =>
					cb.addOption(type, type));

				cb.onChange((value) => {
					this.template = value ? BIBTEX_TYPES[value] : "";
				});
			});

		new Setting(contentEl)
			.setName('BibTex')
			.addTextArea(text => {
				text.setPlaceholder('Enter your bibliography here')
					.onChange((value) => {
						this.bibtex = value
					});
				text.inputEl.addClass("bibtex_manager_bibliography");
			})

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

		containerEl.createEl("h1", { text: "Templates" });


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
					cb.containerEl.addClass("bibtex_manager_search");
				});
		});
	}
}
