import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import { FileSuggest, FolderSuggest, CSLSuggest } from './suggest';
import { parse } from "@retorquere/bibtex-parser";
import { Entry } from "@retorquere/bibtex-parser/grammar";
import { Citation } from "./citation"

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
	enableBibtexFormatting: boolean
	useDefaultFolder: boolean;
	customFolder: string;
	fileName: string;

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
	templateUnpublished: "",
	enableBibtexFormatting: false,
	useDefaultFolder: true,
	customFolder: "",
	fileName: "Untitled"
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

		this.addCommand({
			id: 'create-bibtex',
			name: 'Create',
			callback: () => {
				new CreateBibTexModal(this.app, this.settings).open();
			}
		});


		this.addSettingTab(new BibTeXManagerSettingTab(this.app, this));

		if (this.settings.enableBibtexFormatting) {
			this.registerMarkdownCodeBlockProcessor("bibtex", async (source: string, el, ctx) => {
				const codeBlock = el.createEl("div").createEl("pre").createEl("code");

				try {
					const citation = new Citation(this.settings.cslStyle, false);

					await citation.init()

					const text = parse(source)
					// @ts-ignore
					text.entries.forEach(async (entry: Entry) => {
						citation.add(entry);
					})
					const bib = citation.bibliography()
					codeBlock.createEl("span", { text: bib, cls: "bibtex key" });

				} catch (exception) {
					codeBlock.createEl("span", { text: "Invalid BibTeX format!", cls: "bibtex key" });
				}
			});
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class BibTexModal extends Modal {
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

	async formatBibTexEntry(citation: Citation, entry: Entry, template: string = "") {
		if (!template) {
			return "";
		}

		citation.add(entry);

		const mapping = {
			"type": entry.type,
			"citekey": (<any>entry).key,
			"id": (<any>entry).key,
			"bibliography": citation.bibliography(),
			"citation": citation.get((<any>entry).key)
		}

		const fields = Object.assign(mapping, entry.fields);
		Object.keys(fields).forEach(key => {
			const value = fields[key];
			const regex = new RegExp(`{{(\\w+\\|)?${key}}}`, "g");
			template = template.replace(regex, value);
		})

		return template;
	}

	getFileParent() {
		if (!this.settings.useDefaultFolder) {
			let folder = this.settings.customFolder;
			const abstractFile = this.app.vault.getAbstractFileByPath(folder);
			if (abstractFile && 'children' in (abstractFile as TFolder)) {
				return abstractFile as TFolder;
			} else {
				new Notice(`Error opening folder '${folder}'!`);
				throw new Error(`Could not open the folder at '${folder}'`);
			}
		}

		let lastFile = this.app.workspace.getActiveFile();
		let path = !!lastFile ? lastFile.path : '';
		return this.app.fileManager.getNewFileParent(path);
	}

	generateNewFileNameInFolder(fName: string) {
		const tfolder = this.getFileParent();

		// replace characters that are not allowed in file names
		fName = fName.replace(/[/\\?%*:|"<>\(\)]/g, '');

		let newFilePath = tfolder.path;
		let untitleds = tfolder.children
			.filter((c) => c.name.startsWith(fName))
			.map((c) => c.name);

		let fileName = '';
		for (let i = 0; i <= untitleds.length; i++) {
			fileName = `${fName}${i > 0 ? ' ' + (i + 1) : ''}.md`;
			if (!untitleds.includes(fileName)) {
				break;
			}
		}
		return `${newFilePath}/${fileName}`;
	}
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class InsertBibTexModal extends BibTexModal {
	async onSubmit(text: string) {
		const viewer = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!viewer) {
			new Notice("No active editor");
			return;
		}
		try {
			const citation = new Citation(this.settings.cslStyle, false);

			await citation.init()

			// @ts-ignore
			parse(text).entries.forEach(async (entry: Entry) => {
				const template = await this.getTemplate(entry);
				const note = await this.formatBibTexEntry(citation, entry, template);
				if (note) {
					viewer.editor.replaceSelection(note + "\n");
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
}


class CreateBibTexModal extends BibTexModal {
	async onSubmit(text: string) {
		const viewer = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!viewer) {
			new Notice("No active editor");
			return;
		}
		try {
			const citation = new Citation(this.settings.cslStyle, false);
			await citation.init()
			// @ts-ignore
			parse(text).entries.forEach(async (entry: Entry) => {
				const template = await this.getTemplate(entry);
				const note = await this.formatBibTexEntry(citation, entry, template);
				if (note) {
					const fName = await this.formatBibTexEntry(citation, entry, this.settings.fileName) || "Untitled";
					const fileName = this.generateNewFileNameInFolder(fName);
					const newFile = await this.app.vault.create(fileName, note, {});
				}
			})
		} catch (e) {
			console.error(e);
		}

		this.close();

	}

	async onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Create New Note From BibTeX" });


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
					.setButtonText("Create")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.bibtex);
					}));

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

		containerEl.createEl('h2', { text: "General" });

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
		new Setting(containerEl)
			.setName('Render BibTeX code block as citation')
			.setDesc("Render BibTeX code block as citation using the selected CSL style.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableBibtexFormatting)
				.onChange(async (value) => {
					this.plugin.settings.enableBibtexFormatting = value;
					await this.plugin.saveSettings();
					new Notice("Please reload the app to apply the changes")
				}));
		new Setting(containerEl)
			.setName('Default file name')
			.setDesc(
				"Default file name for new notes."
			)
			.addText((text) => {
				text.setValue(this.plugin.settings.fileName);
				text.onChange(async (value) => {
					this.plugin.settings.fileName = value;
					await this.plugin.saveSettings();
				});
			});
		new Setting(containerEl)
			.setName('Create in the default folder.')
			.setDesc(
				"Create the new files in the default folder as per Obsidian's configuration."
			)
			.addToggle((cb) => {
				cb.setValue(this.plugin.settings.useDefaultFolder);
				cb.onChange(async (value) => {
					this.plugin.settings.useDefaultFolder = value;
					await this.plugin.saveSettings();
				});
			});
		const folderSetting = new Setting(containerEl)
			.setName('Custom folder for new notes.')
			.setDesc(
				"Create the new files in the specified folder."
			)
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setValue(this.plugin.settings.customFolder)
					.setPlaceholder("folder 1/folder 2")
					.onChange((folder) => {
						this.plugin.settings.customFolder = folder;
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
