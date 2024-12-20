import { App, Modal, Notice, TFile, TFolder, Setting, TextAreaComponent } from "obsidian";
import { BibTeXTypes, Settings } from "../settings";
import { Citation } from "../../modules";
import { Entry } from "@retorquere/bibtex-parser/grammar";
import { BibTexProviders, BibTexProvider } from "../providers";

export class BaseModal extends Modal {
	bibtex: string;
	template: string;
	settings: Settings;
	title: string;
	text: TextAreaComponent;
	fetchFrom: string;
	provider: BibTexProvider | null;

	constructor(app: App, settings: Settings) {
		super(app);
		this.settings = settings;
	}

	checkTemplatesExists(): boolean {
		for (const type of BibTeXTypes) {
			const templateName = "template" + type;
			if (!this.settings[templateName]) {
				return false;
			}
		}
		return true;
	}

	async getTemplate(entry: Entry): Promise<string> {
		const templateName =
			entry.type.charAt(0).toUpperCase() + entry.type.slice(1);
		let template = this.template
			? this.settings["template" + this.template]
			: this.settings["template" + templateName];
		if (!template) {
			return "";
		}
		const templateFile = this.app.vault.getAbstractFileByPath(template);
		if (templateFile instanceof TFile) {
			return await this.app.vault.cachedRead(templateFile);
		}
		return "";
	}

	async formatBibTexEntry(
		citation: Citation,
		entry: Entry,
		template: string = "",
	) {
		if (!template) {
			return "";
		}

		citation.add(entry);

		const mapping = {
			type: entry.type,
			citekey: (<any>entry).key,
			id: (<any>entry).key,
			bibliography: citation.all(),
			citation: citation.get((<any>entry).key),
		};

		const fields = Object.assign(mapping, entry.fields);
		Object.keys(fields).forEach((key) => {
			const value = fields[key];
			const regex = new RegExp(`{{(\\w+\\|)?${key}}}`, "g");
			template = template.replace(regex, value);
		});

		return template;
	}

	getFileParent() {
		let folder = this.settings.customFolder;
		// if custom folder is set, use it otherwise use the current file's folder
		if (folder) {
			const abstractFile = this.app.vault.getAbstractFileByPath(folder);
			if (abstractFile instanceof TFolder) {
				return abstractFile;
			}
		}

		let lastFile = this.app.workspace.getActiveFile();
		let path = !!lastFile ? lastFile.path : "";
		return this.app.fileManager.getNewFileParent(path);
	}

	generateNewFileNameInFolder(fName: string) {
		const tfolder = this.getFileParent();

		// replace characters that are not allowed in file names
		fName = fName.replace(/[/\\?%*:|"<>\(\)]/g, "");

		let newFilePath = tfolder.path;
		let untitleds = tfolder.children
			.filter((c) => c.name.startsWith(fName))
			.map((c) => c.name);

		let fileName = "";
		for (let i = 0; i <= untitleds.length; i++) {
			fileName = `${fName}${i > 0 ? " " + (i + 1) : ""}.md`;
			if (!untitleds.includes(fileName)) {
				break;
			}
		}
		return `${newFilePath}/${fileName}`;
	}

	async onOpen() {
		const { contentEl } = this;

		const isTemplateExists = this.checkTemplatesExists();

		if (!isTemplateExists) {

			contentEl.createEl("h2", { text: `Missed templates` });
			const errorMessage = contentEl.createEl("div", { cls: "bibtex-manager-no-settings" });
			errorMessage.createSpan({
				cls: "bibtex-manager-no-settings-text", text: `Please set the template for each BibTeX entry type in plugin settings.`
			});

			new Setting(contentEl)
				.addButton((btn) => {
					btn.setButtonText("Open settings").setCta().onClick(() => {
						const commands = (this.app as any).commands;
						commands.executeCommandById("app:open-settings", { tab: "plugins/bibtex-manager" });
						this.close();
					});
				});
			return;
		}

		contentEl.createEl("h2", { text: `${this.title} a note` });
		new Setting(contentEl)
			.addSearch((text) => {
				text.setPlaceholder("Enter a URL or arXiv ID").onChange((value) => {
					this.provider = null;
					if (!value) {
						text.inputEl.removeClass("bibtex-manager-quick-add--not-found");
						return;
					}
					for (const provider of BibTexProviders) {
						const p = new provider(value)
						const match = p.match();
						if (match) {
							this.provider = p;
							break;
						}
					}
					text.inputEl.toggleClass("bibtex-manager-quick-add--not-found", !!!this.provider);
				});
			})
			.addButton((btn) =>
				btn
					.setButtonText("Fetch")
					.setCta()
					.onClick(async () => {
						if (this.provider) {
							btn.setDisabled(true);
							btn.setButtonText("Fetching...");
							const bibtex = await this.provider.fetch();
							btn.setDisabled(false);
							btn.setButtonText("Fetch");
							if (bibtex) {
								this.bibtex = bibtex;
								this.text.setValue(bibtex);
							}
						}
					}),
			)
			.setClass("bibtex-manager-quick-add");

		// Separator with "or"
		const separator = contentEl.createEl("div", { cls: "bibtex-manager-separator" });
		separator.createSpan({ cls: "bibtex-manager-separator-text", text: "or" });

		new Setting(contentEl)
			.addTextArea((text) => {
				this.text = text;
				text.setPlaceholder(
					"Paste the content of your BibTeX file",
				).onChange((value) => {
					this.bibtex = value;
				});
				text.inputEl.addClass("bibtex-manager-template");
			})
			.setClass("bibtex-manager-template-container");

		new Setting(contentEl).setName("Apply template").addDropdown((cb) => {
			cb.addOption("", "Auto detect");
			BibTeXTypes.forEach((type) => cb.addOption(type, type));

			cb.onChange((value) => {
				this.template = value || "";
			});
		});

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				});
			})
			.addButton((btn) =>
				btn
					.setButtonText(this.title)
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.bibtex);
					}),
			);
	}

	onSubmit(bibtex: string) {
		throw new Error("Method not implemented.");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
