import { App, Modal, Notice, TFile, TFolder } from "obsidian";
import { Settings } from "../settings";
import { Citation } from "../../modules";
import { Entry } from "@retorquere/bibtex-parser/grammar";

export class BaseModal extends Modal {
	bibtex: string;
	template: string;
	settings: Settings;

	constructor(app: App, settings: Settings) {
		super(app);
		this.settings = settings;
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
		if (!this.settings.useDefaultFolder) {
			let folder = this.settings.customFolder;
			const abstractFile = this.app.vault.getAbstractFileByPath(folder);
			if (abstractFile && "children" in (abstractFile as TFolder)) {
				return abstractFile as TFolder;
			} else {
				new Notice(`Error opening folder '${folder}'!`);
				throw new Error(`Could not open the folder at '${folder}'`);
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
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
